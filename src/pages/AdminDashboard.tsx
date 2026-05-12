import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, LayoutGrid, Package, Settings, LogOut, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  description: string;
  finish: string;
  imageUrl: string;
  categoryId: string;
  category?: { name: string };
}

interface LoginHistory {
  id: number;
  username: string;
  when: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'categories' | 'products' | 'users'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | Product | null>(null);

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', imageUrl: '', description: '' });
  const [newProduct, setNewProduct] = useState({ name: '', description: '', finish: '', imageUrl: '', categoryId: '' });
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [adminStatus, setAdminStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // State for confirm modal
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'categories' | 'products'; name: string } | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  
  // Image handling states
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminToken');
    if (!isAuth) {
      navigate('/');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes, historyRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
        fetch('/api/admin/login-history')
      ]);
      
      const cats = await catsRes.json();
      const prods = await prodsRes.json();
      const history = await historyRes.json();
      
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setLoginHistory(Array.isArray(history) ? history : []);
      
      if (!Array.isArray(cats)) console.error("Categories fetch error:", cats);
      if (!Array.isArray(prods)) console.error("Products fetch error:", prods);
      if (!Array.isArray(history)) console.error("Login history fetch error:", history);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus(null);
    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();
      if (res.ok) {
        setAdminStatus({ type: 'success', message: 'Admin created successfully' });
        setNewAdmin({ username: '', password: '' });
      } else {
        setAdminStatus({ type: 'error', message: data.error || 'Failed to create admin' });
      }
    } catch (error) {
      setAdminStatus({ type: 'error', message: 'Failed to connect to server' });
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data.imageUrl;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = newCategory.imageUrl;
      if (uploadMode === 'file' && selectedFile) {
        finalImageUrl = await handleUpload(selectedFile);
      }

      const url = editingItem ? `/api/categories/${editingItem.id}` : '/api/categories';
      const method = editingItem ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCategory, imageUrl: finalImageUrl })
      });
      if (res.ok) {
        handleCloseModal();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let finalImageUrl = newProduct.imageUrl;
      if (uploadMode === 'file' && selectedFile) {
        finalImageUrl = await handleUpload(selectedFile);
      }

      const url = editingItem ? `/api/products/${editingItem.id}` : '/api/products';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newProduct, imageUrl: finalImageUrl })
      });
      if (res.ok) {
        handleCloseModal();
        fetchData();
      }
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: Category | Product) => {
    setEditingItem(item);
    setUploadMode('url');
    // Check if it's a category by looking for its absence in the products list or presence of product-specific fields
    if ('finish' in item) {
      setNewProduct({ 
        name: item.name || '', 
        description: item.description || '',
        finish: item.finish || '', 
        imageUrl: item.imageUrl || '', 
        categoryId: item.categoryId || '' 
      });
      setActiveTab('products');
    } else {
      setNewCategory({ 
        name: item.name || '', 
        imageUrl: item.imageUrl || '', 
        description: item.description || '' 
      });
      setActiveTab('categories');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setUploadMode('url');
    setSelectedFile(null);
    setNewCategory({ name: '', imageUrl: '', description: '' });
    setNewProduct({ name: '', description: '', finish: '', imageUrl: '', categoryId: '' });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      const res = await fetch(`/api/${itemToDelete.type}/${itemToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        setItemToDelete(null);
      }
    } catch (error) {
      console.error(`Error deleting:`, error);
    }
  };

  const filteredProducts = selectedCategoryId === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategoryId);

  const handleOpenAddModal = () => {
    if (activeTab === 'products' && selectedCategoryId !== 'all') {
      setNewProduct(prev => ({ ...prev, categoryId: selectedCategoryId }));
    }
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full">
        <div className="p-8">
          <h2 className="text-xl font-bold tracking-tighter">LUSSO <span className="font-light">CMS</span></h2>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-black transition-all"
          >
            <LayoutGrid size={18} className="rotate-45" />
            View Website
          </Link>
          <div className="h-px bg-gray-100 my-4 mx-4" />
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'categories' ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black"
            )}
          >
            <LayoutGrid size={18} />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'products' ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black"
            )}
          >
            <Package size={18} />
            Products
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
              activeTab === 'users' ? "bg-black text-white" : "text-gray-500 hover:bg-gray-50 hover:text-black"
            )}
          >
            <Settings size={18} />
            Admins
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight capitalize">{activeTab}</h1>
              <p className="text-gray-500">Manage your store's {activeTab} and content.</p>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-all shadow-lg shadow-black/10"
            >
              <Plus size={20} />
              Add {activeTab === 'categories' ? 'Category' : 'Product'}
            </button>
          </div>

          <div className="flex items-center gap-4 mb-8">
            {activeTab === 'products' && (
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filter by Category:</span>
                <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="text-sm font-medium outline-none bg-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <button 
              onClick={() => setActiveTab('categories')}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left hover:border-black transition-all group"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                  <LayoutGrid size={20} />
                </div>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Collections</span>
              </div>
              <p className="text-3xl font-bold">{categories.length}</p>
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left hover:border-black transition-all group"
            >
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-green-50 text-green-500 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                  <Package size={20} />
                </div>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Products</span>
              </div>
              <p className="text-3xl font-bold">{products.length}</p>
            </button>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-purple-50 text-purple-500 rounded-xl">
                  <Settings size={20} />
                </div>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Status</span>
              </div>
              <p className="text-3xl font-bold text-green-500">Live</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-gray-300" size={48} />
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-12">
              {/* Add New Admin */}
              <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-6">Add New Admin</h2>
                <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Username</label>
                    <input 
                      required
                      value={newAdmin.username}
                      onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Password</label>
                    <input 
                      required
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <button className="py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-all">
                    Create Admin
                  </button>
                </form>
                {adminStatus && (
                  <p className={cn("mt-4 text-sm font-medium", adminStatus.type === 'success' ? "text-green-500" : "text-red-500")}>
                    {adminStatus.message}
                  </p>
                )}
              </div>

              {/* Login History */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-100">
                  <h2 className="text-xl font-bold">Login History</h2>
                  <p className="text-sm text-gray-500">Last 5 successful login attempts.</p>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Admin User</th>
                      <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loginHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6 font-bold text-gray-900">{log.username}</td>
                        <td className="px-8 py-6 text-sm text-gray-500 text-right">
                          {new Date(log.when).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {loginHistory.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-8 py-10 text-center text-gray-400">No login history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Details</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(activeTab === 'categories' ? categories : filteredProducts).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="font-bold text-gray-900">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-gray-500">
                        {activeTab === 'categories' 
                          ? `${(item as Category)._count?.products || 0} Products` 
                          : `${(item as Product).finish} • ${(item as Product).category?.name}`}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setActiveTab('products');
                              setNewProduct(prev => ({ ...prev, categoryId: item.id }));
                              setShowModal(true);
                            }}
                            title="Add product to this category"
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => setItemToDelete({ id: item.id, type: activeTab, name: item.name })}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(activeTab === 'categories' ? categories : filteredProducts).length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center text-gray-400">
                        No {activeTab} found. Click the button above to add one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-10 shadow-2xl"
            >
              <button 
                onClick={handleCloseModal}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold mb-8">{editingItem ? 'Edit' : 'Add New'} {activeTab === 'categories' ? 'Category' : 'Product'}</h2>
              
              <form onSubmit={activeTab === 'categories' ? handleAddCategory : handleAddProduct} className="space-y-6">
                {activeTab === 'categories' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Name</label>
                      <input 
                        required
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        placeholder="e.g. Bathroom"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Image Source</label>
                      <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
                        <button 
                          type="button"
                          onClick={() => setUploadMode('url')}
                          className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", uploadMode === 'url' ? "bg-white shadow-sm" : "text-gray-400")}
                        >
                          URL
                        </button>
                        <button 
                          type="button"
                          onClick={() => setUploadMode('file')}
                          className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", uploadMode === 'file' ? "bg-white shadow-sm" : "text-gray-400")}
                        >
                          Upload
                        </button>
                      </div>
                    </div>

                    {uploadMode === 'url' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Image URL</label>
                        <input 
                          required
                          value={newCategory.imageUrl}
                          onChange={(e) => setNewCategory({...newCategory, imageUrl: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Upload Image</label>
                        <input 
                          type="file"
                          accept="image/*"
                          required={!editingItem}
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea 
                        required
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        placeholder="Short description..."
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Name</label>
                      <input 
                        required
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        placeholder="e.g. Carrara Marble Tile"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Finish</label>
                      <input 
                        required
                        value={newProduct.finish}
                        onChange={(e) => setNewProduct({...newProduct, finish: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        placeholder="e.g. Honed"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea 
                        required
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        placeholder="Short description..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Image Source</label>
                      <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
                        <button 
                          type="button"
                          onClick={() => setUploadMode('url')}
                          className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", uploadMode === 'url' ? "bg-white shadow-sm" : "text-gray-400")}
                        >
                          URL
                        </button>
                        <button 
                          type="button"
                          onClick={() => setUploadMode('file')}
                          className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", uploadMode === 'file' ? "bg-white shadow-sm" : "text-gray-400")}
                        >
                          Upload
                        </button>
                      </div>
                    </div>

                    {uploadMode === 'url' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Image URL</label>
                        <input 
                          required
                          value={newProduct.imageUrl}
                          onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Upload Image</label>
                        <input 
                          type="file"
                          accept="image/*"
                          required={!editingItem}
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Category</label>
                      <select 
                        required
                        value={newProduct.categoryId}
                        onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                
                <button 
                  disabled={uploading}
                  className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition-all mt-4 disabled:opacity-50"
                >
                  {uploading ? 'Processing...' : `Save ${activeTab === 'categories' ? 'Category' : 'Product'}`}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Delete {itemToDelete.name}?</h3>
              <p className="text-gray-500 mb-8 text-sm">
                This action cannot be undone. Are you sure you want to permanently delete this {itemToDelete.type.slice(0, -1)}?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

