// server.ts — Cloudflare Worker API + SPA fallback (no uploads)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Utility: SHA-256 hashing
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(hash)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Utility: JSON body parser
    async function getJSON(req) {
      try {
        return await req.json();
      } catch {
        return null;
      }
    }

    // Utility: session cookie parser
    function getSession(request) {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/admin_session=([^;]+)/);
      return match ? match[1] : null;
    }

    // Utility: require admin session
    function requireAdmin(request) {
      return getSession(request) !== null;
    }

    // ─────────────────────────────────────────────
    // AUTH: LOGIN (POST /api/login)
    // ─────────────────────────────────────────────
    if (url.pathname === "/api/login" && method === "POST") {
      const body = await getJSON(request);
      if (!body) return new Response("Invalid JSON", { status: 400 });

      const { username, password } = body;

      const user = await env.DB.prepare(
        "SELECT * FROM AdminUser WHERE username = ?"
      ).bind(username).first();

      if (!user) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const hashed = await hashPassword(password);

      if (hashed !== user.passwordHash) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Record login
      await env.DB.prepare(
        "INSERT INTO AdminLogins (username, when) VALUES (?, ?)"
      )
        .bind(user.username, new Date().toISOString())
        .run();

      // Create session cookie
      const cookie = `admin_session=${user.id}; Path=/; HttpOnly; Secure; SameSite=Lax`;

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie
        }
      });
    }

    // ─────────────────────────────────────────────
    // AUTH: REGISTER ADMIN (POST /api/admin/register)
    // ─────────────────────────────────────────────
    if (url.pathname === "/api/admin/register" && method === "POST") {
      const body = await getJSON(request);
      if (!body) return new Response("Invalid JSON", { status: 400 });

      const { username, password } = body;

      const existing = await env.DB.prepare(
        "SELECT * FROM AdminUser WHERE username = ?"
      ).bind(username).first();

      if (existing) {
        return new Response(
          JSON.stringify({ error: "Username already exists" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const passwordHash = await hashPassword(password);

      await env.DB.prepare(
        "INSERT INTO AdminUser (username, passwordHash) VALUES (?, ?)"
      )
        .bind(username, passwordHash)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ─────────────────────────────────────────────
    // ADMIN LOGIN HISTORY (GET /api/admin/login-history)
    // ─────────────────────────────────────────────
    if (url.pathname === "/api/admin/login-history" && method === "GET") {
      if (!requireAdmin(request)) {
        return new Response("Unauthorized", { status: 401 });
      }

      const history = await env.DB.prepare(
        "SELECT * FROM AdminLogins ORDER BY id DESC LIMIT 5"
      ).all();

      return new Response(JSON.stringify(history.results), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
// ─────────────────────────────────────────────
// AUTH: LOGOUT (GET /api/logout)
// ─────────────────────────────────────────────
if (url.pathname === "/api/logout" && method === "GET") {
  const expiredCookie =
    "admin_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/",   // send user home
      "Set-Cookie": expiredCookie
    }
  });
}


    // ─────────────────────────────────────────────
    // CATEGORIES CRUD
    // ─────────────────────────────────────────────

    // GET categories
    if (url.pathname === "/api/categories" && method === "GET") {
      const categories = await env.DB.prepare(
        "SELECT * FROM Category"
      ).all();

      return new Response(JSON.stringify(categories.results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // CREATE category
    if (url.pathname === "/api/categories" && method === "POST") {
      if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

      const body = await getJSON(request);
      const { name, imageUrl, description } = body;

      const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

      await env.DB.prepare(
        "INSERT INTO Category (name, slug, imageUrl, description) VALUES (?, ?, ?, ?)"
      )
        .bind(name, slug, imageUrl, description)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // UPDATE category
    if (url.pathname.startsWith("/api/categories/") && method === "PATCH") {
      if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

      const id = url.pathname.split("/").pop();
      const body = await getJSON(request);

      const fields = [];
      const values = [];

      for (const key in body) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }

      values.push(id);

      await env.DB.prepare(
        `UPDATE Category SET ${fields.join(", ")} WHERE id = ?`
      ).bind(...values).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // DELETE category
    if (url.pathname.startsWith("/api/categories/") && method === "DELETE") {
      if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

      const id = url.pathname.split("/").pop();

      await env.DB.prepare("DELETE FROM Category WHERE id = ?")
        .bind(id)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ─────────────────────────────────────────────
    // PRODUCTS CRUD
    // ─────────────────────────────────────────────

    // GET products
    if (url.pathname === "/api/products" && method === "GET") {
      const categoryId = url.searchParams.get("categoryId");

      let query = "SELECT * FROM Product";
      let params = [];

      if (categoryId) {
        query += " WHERE categoryId = ?";
        params.push(categoryId);
      }

      const products = await env.DB.prepare(query).bind(...params).all();

      return new Response(JSON.stringify(products.results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // CREATE product
    if (url.pathname === "/api/products" && method === "POST") {
      if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

      const body = await getJSON(request);
      const { name, description, finish, imageUrl, categoryId } = body;

      const slug = name.toLowerCase().trim().replace(/\s+/g, "-");

      await env.DB.prepare(
        "INSERT INTO Product (name, slug, description, finish, imageUrl, categoryId) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(name, slug, description, finish, imageUrl, categoryId)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // UPDATE product
    if (url.pathname.startsWith("/api/products/") && method === "PATCH") {
      if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

      const id = url.pathname.split("/").pop();
      const body = await getJSON(request);

      const fields = [];
      const values = [];

      for (const key in body) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }

      values.push(id);

      await env.DB.prepare(
        `UPDATE Product SET ${fields.join(", ")} WHERE id = ?`
      ).bind(...values).run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // DELETE product
    if (url.pathname.startsWith("/api/products/") && method === "DELETE") {
      if (!requireAdmin(request)) return new Response("Unauthorized", { status: 401 });

      const id = url.pathname.split("/").pop();

      await env.DB.prepare("DELETE FROM Product WHERE id = ?")
        .bind(id)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ─────────────────────────────────────────────
    // SPA FALLBACK
    // ─────────────────────────────────────────────
    let assetResponse = await env.ASSETS.fetch(request);

    if (assetResponse.status === 404) {
      return env.ASSETS.fetch(new Request(url.origin + "/index.html"));
    }

    return assetResponse;
  }
};