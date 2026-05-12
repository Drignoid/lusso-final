import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="./building.png"
          alt="Lusso Design Background"
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block text-white/70 tracking-[0.3em] uppercase text-xs mb-6 font-medium">
            Premium Fixtures and Fittings
          </span>
          <h1 className="text-5xl md:text-8xl font-bold text-white tracking-tighter mb-8 leading-tight">
            LUSSO <span className="font-light italic">DESIGN</span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
            Elevate your space with our curated collection of high-end architectural elements. 
            Craftsmanship meets modern sophistication.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              to="/collections"
              className="group relative px-10 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-all hover:pr-14"
            >
              <span className="relative z-10">Explore Collection</span>
              <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300" size={20} />
            </Link>
            <Link
              to="/about"
              className="text-white/80 hover:text-white font-medium transition-colors border-b border-white/20 hover:border-white pb-1"
            >
              Our Story
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="w-1px h-12 bg-linear-to-b from-white/50 to-transparent" />
      </motion.div>
    </div>
  );
}
