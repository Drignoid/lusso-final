import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  _count?: {
    products: number;
  };
}

export default function Collections() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch categories:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-300" size={48} />
      </div>
    );
  }

  return (
    <div className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">Our Collections</h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          Explore our curated range of premium fixtures and architectural elements, 
          designed to transform any space into a masterpiece.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/collections/${category.id}`}
              className="group block relative aspect-4/5 overflow-hidden rounded-2xl bg-gray-100"
            >
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                <p className="text-white/70 text-sm mb-6 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                  {category.description}
                </p>
                <div className="flex items-center text-white font-medium text-sm">
                  <span>View Collection</span>
                  <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-400 mb-4">No collections found.</p>
            <Link to="/admin" className="text-black font-bold underline">Add your first category</Link>
          </div>
        )}
      </div>
    </div>
  );
}

