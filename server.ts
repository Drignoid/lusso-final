// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";

export const prisma = new PrismaClient();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use("/uploads", express.static(uploadDir));

  // --- API ROUTES ---

  // Upload endpoint
  app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  });

  // Auth
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await prisma.adminUser.findUnique({ where: { username } });
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

      // In a real app, we would return a JWT here
      
      // Record login history
      await prisma.adminLogins.create({
        data: {
          username: user.username,
          when: new Date().toISOString()
        }
      });

      res.json({ success: true, user: { username: user.username } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Admin Management
  app.get("/api/admin/login-history", async (req, res) => {
    try {
      const history = await prisma.adminLogins.findMany({
        take: 5,
        orderBy: { id: 'desc' }
      });
      res.json(history);
    } catch (error) {
      console.error("Fetch login history error:", error);
      res.status(500).json({ error: "Failed to fetch login history" });
    }
  });

  app.post("/api/admin/register", async (req, res) => {
    const { username, password } = req.body;
    try {
      const existing = await prisma.adminUser.findUnique({ where: { username } });
      if (existing) return res.status(400).json({ error: "Username already exists" });

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.adminUser.create({
        data: { username, passwordHash }
      });
      res.json({ success: true, user: { username: newUser.username } });
    } catch (error) {
      console.error("Register admin error:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await prisma.category.findMany({
        include: { _count: { select: { products: true } } }
      });
      res.json(categories);
    } catch (error) {
      console.error("Fetch categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const { name, imageUrl, description } = req.body;
      const slug = slugify(name);
      const category = await prisma.category.create({ 
        data: { name, slug, imageUrl, description } 
      });
      res.json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const { name, imageUrl, description } = req.body;
      const data: any = { imageUrl, description };
      
      if (name) {
        data.name = name;
        data.slug = slugify(name);
      }

      // Remove undefined fields
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      
      const category = await prisma.category.update({
        where: { id: req.params.id },
        data
      });
      res.json(category);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await prisma.category.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const products = await prisma.product.findMany({
        where: categoryId ? { categoryId: String(categoryId) } : {},
        include: { category: true }
      });
      res.json(products);
    } catch (error) {
      console.error("Fetch products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const { name, description, finish, imageUrl, categoryId } = req.body;
      const slug = slugify(name);
      const product = await prisma.product.create({ 
        data: { 
          name, 
          slug, 
          description: description || name, 
          finish, 
          imageUrl, 
          categoryId 
        } 
      });
      res.json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const { name, description, finish, imageUrl, categoryId } = req.body;
      const data: any = { description, finish, imageUrl, categoryId };
      
      if (name) {
        data.name = name;
        data.slug = slugify(name);
      }

      // Remove undefined fields
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

      const product = await prisma.product.update({
        where: { id: req.params.id },
        data
      });
      res.json(product);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await prisma.product.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // --- VITE MIDDLEWARE ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
