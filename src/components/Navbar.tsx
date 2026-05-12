import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X, User, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { useEnquiry } from '../context/EnquiryContext';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname === '/login';
  const [isOpen, setIsOpen] = useState(false);

  const { enquiryItems } = useEnquiry();

  if (isHome || isAdmin) return null;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Collections', path: '/collections' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: `Enquiry (${enquiryItems.length})`, path: '/contact', highlight: enquiryItems.length > 0 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="text-2xl font-bold tracking-tighter text-black">
            LUSSO <span className="font-light">DESIGN</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-black",
                  location.pathname === link.path ? "text-black" : "text-gray-500",
                  link.highlight && "text-black font-bold"
                )}
              >
                {link.name}
              </Link>
            ))}
            {/* <Link to="/login" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <User size={20} className="text-gray-600" />
            </Link> */}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-black hover:bg-gray-100"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-2"
        >
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={cn(
                "block px-3 py-4 text-base font-medium rounded-md",
                location.pathname === link.path ? "bg-gray-50 text-black" : "text-gray-600 hover:bg-gray-50 hover:text-black"
              )}
            >
              {link.name}
            </Link>
          ))}
        </motion.div>
      )}
    </nav>
  );
}
