import React, { useState } from 'react';
import { useEnquiry } from '../context/EnquiryContext';
import { Trash2, Send, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Contact() {
  const { enquiryItems, removeFromEnquiry, clearEnquiry } = useEnquiry();
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleEmailEnquiry = () => {
    const productsList = enquiryItems.map(item => `- ${item.name} (${item.finish})`).join('%0D%0A');
    const body = `Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0AMessage: ${formData.message}%0D%0A%0D%0AEnquired Products:%0D%0A${productsList}`;
    window.location.href = `mailto:sales@lusso-design.com?subject=Product Enquiry from ${formData.name}&body=${body}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      setIsSending(false);
      setIsSuccess(true);
      // If there are enquiry items, trigger the mailto as well for a real integration feel
      if (enquiryItems.length > 0) {
        handleEmailEnquiry();
      }
      setTimeout(() => setIsSuccess(false), 5000);
    }, 1500);
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start gap-16">
        {/* Left Side: General Info & Form */}
        <div className="w-full md:w-5/12 space-y-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter">Get in Touch</h1>
            <p className="text-gray-500 text-lg leading-relaxed">
              Whether you're an interior designer or a homeowner, we're here to help you bring luxury to your spaces.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Email Us</p>
                <p className="font-semibold">sales@lusso-design.com</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Call Us</p>
                <p className="font-semibold">+61 (04) 340-0000</p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="p-3 bg-gray-50 rounded-xl text-gray-400">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Showroom</p>
                <p className="font-semibold">123 Lakeland Way, Broadbeach, QLD</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-8 border-t border-gray-100">
            <input 
              required
              type="text" 
              placeholder="Full Name" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
            />
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all" 
            />
            <textarea 
              placeholder="Your Message" 
              rows={4} 
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
            ></textarea>
            
            <button 
              disabled={isSending}
              className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2 group disabled:bg-gray-400"
            >
              {isSending ? (
                "Sending..."
              ) : isSuccess ? (
                "Message Sent!"
              ) : (
                <>
                  {enquiryItems.length > 0 ? "Email Enquiry" : "Send Message"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Enquiry List */}
        <div className="w-full md:w-7/12 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 flex flex-col min-h-[600px] overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Enquiry List</h2>
              <p className="text-gray-400 text-sm mt-1">{enquiryItems.length} products selected</p>
            </div>
            {enquiryItems.length > 0 && (
              <button 
                onClick={clearEnquiry}
                className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            <AnimatePresence initial={false}>
              {enquiryItems.length > 0 ? (
                enquiryItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center group"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">{item.finish}</p>
                    </div>
                    <button 
                      onClick={() => removeFromEnquiry(item.id)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                    <Mail className="text-gray-200" size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Your list is empty</h3>
                  <p className="text-sm text-gray-400 mt-2 max-w-[240px]">
                    Browse our collections and add products you're interested in.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {enquiryItems.length > 0 && (
            <div className="p-8 bg-white border-t border-gray-50">
              <p className="text-xs text-gray-400 text-center uppercase tracking-widest font-bold">
                Ready to send?
              </p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Your selected products will be included in the email enquiry.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
