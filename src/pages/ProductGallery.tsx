import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Filter, Loader2, X, ShoppingBag, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEnquiry } from '../context/EnquiryContext';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  name: string;
  finish: string;
  imageUrl: string;
  description?: string;
  categoryId: string;
  category?: {
    name: string;
  };
}

export default function ProductGallery() {
  const { categoryId } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('Collection');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { addToEnquiry, enquiryItems } = useEnquiry();

  const isEnquired = (id: string) => enquiryItems.some(item => item.id === id);

  useEffect(() => {
    fetch(`/api/products?categoryId=${categoryId}`)
      .then(res => res.json())
      .then(data => {
        const prodData = Array.isArray(data) ? data : [];
        setProducts(prodData);
        if (prodData.length > 0 && prodData[0].category) {
          setCategoryName(prodData[0].category.name);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, [categoryId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-300" size={48} />
      </div>
    );
  }

  return (
    <div className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/collections"
            className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-4 transition-colors"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back to Collections
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">{categoryName} Collection</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <span className="text-sm text-gray-400">{products.length} Products</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group cursor-pointer"
            onClick={() => setSelectedProduct(product)}
            id={`product-card-${product.id}`}
          >
            <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 mb-6 relative">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500 uppercase tracking-widest">{product.finish}</p>
            </div>
          </motion.div>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-400">No products found in this collection yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh] md:h-auto"
              id="product-modal"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-900 hover:bg-white transition-colors border border-gray-100"
                id="close-modal-button"
              >
                <X size={20} />
              </button>

              <div className="w-full md:w-1/2 bg-gray-100 aspect-square md:aspect-auto">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-gray-400 font-medium tracking-widest uppercase mb-2">
                       {categoryName} Collection
                    </p>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-gray-900">
                      {selectedProduct.name}
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Finish</h4>
                      <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                        {selectedProduct.finish}
                      </p>
                    </div>

                    {selectedProduct.description && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Description</h4>
                        <p className="text-gray-600 leading-relaxed">
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-gray-100 space-y-4">
                    <button 
                      onClick={() => selectedProduct && addToEnquiry(selectedProduct)}
                      disabled={selectedProduct ? isEnquired(selectedProduct.id) : false}
                      className={cn(
                        "w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg",
                        selectedProduct && isEnquired(selectedProduct.id) 
                          ? "bg-green-500 text-white shadow-green-500/20" 
                          : "bg-black text-white hover:bg-gray-800 shadow-black/10"
                      )}
                    >
                      {selectedProduct && isEnquired(selectedProduct.id) ? (
                        <>
                          <Check size={18} />
                          Added to Enquiry
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          Add to My Enquiry
                        </>
                      )}
                    </button>
                    
                    {selectedProduct && isEnquired(selectedProduct.id) && (
                      <Link 
                        to="/contact"
                        className="w-full py-3 border border-gray-100 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                      >
                        View Enquiry List ({enquiryItems.length})
                      </Link>
                    )}
                    <p className="text-xs text-center text-gray-400 mt-4">
                      Crafted with precision using the finest materials.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


