'use client';

import { motion } from 'framer-motion';
import { FaChartPie, FaExchangeAlt, FaFilm, FaRobot, FaServer, FaDatabase, FaCode, FaLightbulb } from 'react-icons/fa';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-xl p-8 mb-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-12"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-4">About MovieSense</h2>
          <p className="text-xl text-indigo-200 max-w-3xl mx-auto">
            An advanced AI-powered platform for analyzing movie reviews and extracting meaningful insights through sentiment analysis.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div variants={itemVariants} className="bg-indigo-900/40 border border-indigo-500/20 rounded-xl p-6 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Our Mission</h3>
          <p className="text-lg text-indigo-200">
            To transform the way people understand film reception by providing deep, AI-driven insights into audience sentiment, 
            helping movie enthusiasts, critics, and industry professionals make more informed decisions.
          </p>
        </motion.div>

        {/* Key Features */}
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-800/40 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center mr-4">
                  <FaRobot className="text-2xl text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Advanced Sentiment Analysis</h4>
              </div>
              <p className="text-indigo-200">
                Leveraging state-of-the-art NLP models to accurately classify reviews as positive, negative, or neutral with confidence scores.
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-800/40 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center mr-4">
                  <FaChartPie className="text-2xl text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Visual Analytics</h4>
              </div>
              <p className="text-indigo-200">
                Interactive charts and visualizations that make it easy to understand sentiment trends and patterns across multiple reviews.
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-800/40 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-violet-600 flex items-center justify-center mr-4">
                  <FaExchangeAlt className="text-2xl text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Comparative Analysis</h4>
              </div>
              <p className="text-indigo-200">
                Compare sentiment across multiple movie reviews to identify patterns and differences in audience reception.
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-800/40 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-fuchsia-600 flex items-center justify-center mr-4">
                  <FaFilm className="text-2xl text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Movie Rating Aggregator</h4>
              </div>
              <p className="text-indigo-200">
                Aggregate multiple reviews for a single movie to generate comprehensive sentiment scores and distribution analysis.
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-800/40 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-pink-600 flex items-center justify-center mr-4">
                  <FaDatabase className="text-2xl text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Batch Processing</h4>
              </div>
              <p className="text-indigo-200">
                Upload and analyze multiple reviews simultaneously through our CSV batch processing feature for efficient analysis.
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6 hover:bg-indigo-800/40 transition-colors">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-600 flex items-center justify-center mr-4">
                  <FaLightbulb className="text-2xl text-white" />
                </div>
                <h4 className="text-xl font-semibold text-white">Aspect-Based Analysis</h4>
              </div>
              <p className="text-indigo-200">
                Detailed breakdown of sentiment by specific aspects of films such as acting, plot, visual elements, and direction.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Technology Stack */}
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Technology Stack</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FaCode className="mr-2 text-purple-400" />
                Frontend
              </h4>
              <ul className="space-y-2 text-indigo-200">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Next.js 15 with React 19 for a modern, responsive UI
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  TypeScript for type-safe code and better developer experience
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Tailwind CSS for beautiful, responsive designs
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Framer Motion for smooth, engaging animations
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Chart.js for interactive data visualizations
                </li>
              </ul>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4 flex items-center">
                <FaServer className="mr-2 text-indigo-400" />
                Backend
              </h4>
              <ul className="space-y-2 text-indigo-200">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Flask server for API endpoints and sentiment analysis
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Advanced NLP models trained on IMDB movie review datasets
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Python for data processing and machine learning
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  Gunicorn for production-ready server deployment
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                  RESTful API architecture for seamless frontend-backend integration
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Use Cases */}
        <motion.div variants={itemVariants}>
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Use Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-5 text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Film Critics</h4>
              <p className="text-indigo-200 text-sm">
                Analyze sentiment patterns across reviews to identify trends and biases in critical reception.
              </p>
            </div>
            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-5 text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Movie Studios</h4>
              <p className="text-indigo-200 text-sm">
                Gain insights into audience reception to inform marketing strategies and future productions.
              </p>
            </div>
            <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-lg p-5 text-center">
              <h4 className="text-lg font-semibold text-white mb-2">Film Enthusiasts</h4>
              <p className="text-indigo-200 text-sm">
                Discover the emotional impact of films and make informed viewing decisions.
              </p>
            </div>
          </div>
        </motion.div>

        
      </motion.div>
    </div>
  );
}