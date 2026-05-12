import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductGallery from './pages/ProductGallery';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import About from './pages/About';
import Contact from './pages/Contact';
import { AnimatePresence } from 'motion/react';
import { EnquiryProvider } from './context/EnquiryContext';

export default function App() {
  return (
    <EnquiryProvider>
      <Router>
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
          <Navbar />
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:categoryId" element={<ProductGallery />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </AnimatePresence>
          
          <footer className="bg-gray-50 py-20 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <h2 className="text-2xl font-bold tracking-tighter mb-4">LUSSO DESIGN</h2>
              <p className="text-gray-400 text-sm">© 2026 Lusso Design. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </EnquiryProvider>
  );
}