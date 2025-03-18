'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaFilm, FaChartLine, FaRobot, FaSearch } from 'react-icons/fa';

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    // Optional: Add parallax effect on scroll
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      heroRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background with particles */}
      <div className="absolute inset-0 animated-gradient opacity-30"></div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-purple-800/30 rounded-full mix-blend-multiply filter blur-xl floating"></div>
        <div className="absolute top-1/3 right-1/6 w-80 h-80 bg-indigo-800/30 rounded-full mix-blend-multiply filter blur-xl floating animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-violet-800/30 rounded-full mix-blend-multiply filter blur-xl floating animation-delay-4000"></div>
        
        {/* Film reel decorative elements */}
        <div className="absolute -top-20 -left-20 opacity-20 scale">
          <div className="w-40 h-40 border-8 border-indigo-300 rounded-full"></div>
        </div>
        <div className="absolute -bottom-20 -right-20 opacity-20 scale">
          <div className="w-40 h-40 border-8 border-purple-300 rounded-full"></div>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        ref={heroRef}
        className="relative z-10 text-center max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-block py-1 px-3 rounded-full text-sm font-medium bg-indigo-900/50 text-indigo-200 mb-4">
            Powered by Advanced AI
          </span>
          <h1 className="text-5xl sm:text-7xl font-bold mb-4 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600">
              Movie Sentiment
            </span>
            <br />
            <span className="text-white">Analysis Platform</span>
          </h1>
        </motion.div>
        
        <motion.p 
          variants={itemVariants}
          className="text-xl sm:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed"
        >
          Discover the emotional impact of film reviews through AI-powered sentiment analysis. 
          Gain valuable insights into audience reactions and critical reception.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
        >
          <a 
            href="#analyze" 
            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-white font-semibold transition-all hover:shadow-lg hover:shadow-purple-500/30 hover-lift relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              <FaSearch className="text-lg" />
              Analyze Review
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </a>
          <a 
            href="#history" 
            className="group px-8 py-4 bg-transparent border-2 border-indigo-500 hover:border-indigo-400 rounded-lg text-indigo-300 font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover-lift"
          >
            <span className="flex items-center gap-2">
              <FaChartLine className="text-lg" />
              View History
            </span>
          </a>
        </motion.div>

        {/* Feature highlights */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="p-8 rounded-2xl bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 hover-lift group transition-all duration-300 hover:bg-indigo-900/40">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <FaFilm className="text-3xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sentiment Detection</h3>
            <p className="text-gray-300">Instantly analyze the emotional tone of any movie review with high accuracy</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 hover-lift group transition-all duration-300 hover:bg-indigo-900/40">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <FaChartLine className="text-3xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Visual Analytics</h3>
            <p className="text-gray-300">Track sentiment trends with beautiful interactive charts and visualizations</p>
          </div>
          
          <div className="p-8 rounded-2xl bg-indigo-900/30 backdrop-blur-sm border border-indigo-500/20 hover-lift group transition-all duration-300 hover:bg-indigo-900/40">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
              <FaRobot className="text-3xl text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-300">Leveraging state-of-the-art natural language processing models for deep insights</p>
          </div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <a href="#analyze" className="flex flex-col items-center text-indigo-300 hover:text-indigo-200 transition-colors">
            <span className="text-sm mb-2">Scroll to explore</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
}