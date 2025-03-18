'use client';

import { useState } from 'react';
import { FaSmile, FaFrown, FaMeh, FaTheaterMasks, FaFilm, FaBook, FaVideo, FaDirections, FaTag, FaChartPie, FaDownload, FaShareAlt, FaInfoCircle } from 'react-icons/fa';
import { SentimentResponse } from '../api/sentimentService';
import SentimentVisualizations from './SentimentVisualizations';
import { motion } from 'framer-motion';

interface SentimentResultProps {
  result: SentimentResponse | null;
  movieTitle?: string;
}

export default function SentimentResult({ result, movieTitle }: SentimentResultProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'visualizations'>('summary');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  if (!result) return null;

  const { sentiment, confidence, key_phrases, aspect_analysis } = result;
  const confidencePercentage = Math.round(confidence * 100);
  
  // Determine color and icon based on sentiment
  const getSentimentColor = (type: 'bg' | 'text' | 'border' | 'fill' = 'bg') => {
    switch (sentiment) {
      case 'positive':
        return type === 'bg' ? 'bg-purple-100 dark:bg-purple-900/30' : 
               type === 'text' ? 'text-purple-700 dark:text-purple-300' : 
               type === 'border' ? 'border-purple-500' :
               'fill-purple-500';
      case 'negative':
        return type === 'bg' ? 'bg-red-100 dark:bg-red-900/30' : 
               type === 'text' ? 'text-red-700 dark:text-red-300' : 
               type === 'border' ? 'border-red-500' :
               'fill-red-500';
      case 'neutral':
        return type === 'bg' ? 'bg-indigo-100 dark:bg-indigo-900/30' : 
               type === 'text' ? 'text-indigo-700 dark:text-indigo-300' : 
               type === 'border' ? 'border-indigo-500' :
               'fill-indigo-500';
      default:
        return type === 'bg' ? 'bg-gray-100 dark:bg-gray-800' : 
               type === 'text' ? 'text-gray-700 dark:text-gray-300' : 
               type === 'border' ? 'border-gray-500' :
               'fill-gray-500';
    }
  };

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <FaSmile className="text-purple-500 text-4xl" />;
      case 'negative':
        return <FaFrown className="text-red-500 text-4xl" />;
      case 'neutral':
        return <FaMeh className="text-indigo-500 text-4xl" />;
      default:
        return null;
    }
  };
  
  // Get icon for aspect categories
  const getAspectIcon = (aspect: string) => {
    switch (aspect) {
      case 'Emotional Impact':
        return <FaTheaterMasks className="text-purple-500" />;
      case 'Acting Quality':
        return <FaFilm className="text-indigo-500" />;
      case 'Plot & Story':
        return <FaBook className="text-violet-500" />;
      case 'Visual Elements':
      case 'Visual Appeal':
        return <FaVideo className="text-fuchsia-500" />;
      case 'Direction':
        return <FaDirections className="text-pink-500" />;
      case 'Entertainment Value':
        return <FaChartPie className="text-amber-500" />;
      default:
        return <FaTag className="text-gray-500" />;
    }
  };

  // Get description for aspect categories
  const getAspectDescription = (aspect: string) => {
    switch (aspect) {
      case 'Emotional Impact':
        return 'How the film affects viewers emotionally';
      case 'Acting Quality':
        return 'Performance quality of the cast';
      case 'Plot & Story':
        return 'Quality and engagement of the narrative';
      case 'Visual Elements':
      case 'Visual Appeal':
        return 'Cinematography, effects, and visual presentation';
      case 'Direction':
        return 'Quality of the director\'s vision and execution';
      case 'Entertainment Value':
        return 'Overall enjoyment and entertainment factor';
      default:
        return 'General aspect of the film';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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

  // Function to export results as JSON
  const exportResults = () => {
    const dataStr = JSON.stringify({
      movieTitle,
      sentiment,
      confidence: confidencePercentage,
      key_phrases,
      aspect_analysis,
      analyzed_at: new Date().toISOString()
    }, null, 2);
    
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `${movieTitle ? movieTitle.replace(/\s+/g, '_') : 'movie'}_sentiment_analysis.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <motion.div 
      className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div className="flex justify-between items-center mb-6" variants={itemVariants}>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <span className="mr-2">Sentiment Analysis</span>
          {movieTitle && (
            <span className="text-lg font-medium text-gray-600 dark:text-gray-400">
              for &quot;{movieTitle}&quot;
            </span>
          )}
        </h2>
        
        <div className="flex space-x-2">
          <button 
            onClick={exportResults}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
          >
            <FaDownload size={14} />
            <span>Export</span>
          </button>
          
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `Sentiment Analysis for ${movieTitle || 'Movie Review'}`,
                  text: `This review is ${sentiment} with ${confidencePercentage}% confidence.`
                });
              }
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            <FaShareAlt size={14} />
            <span>Share</span>
          </button>
        </div>
      </motion.div>
      
      {/* Tab Navigation */}
      <motion.div className="flex border-b border-gray-200 dark:border-gray-700 mb-6" variants={itemVariants}>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'summary' ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'details' ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('details')}
        >
          Detailed Analysis
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'visualizations' ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
          onClick={() => setActiveTab('visualizations')}
        >
          Visualizations
        </button>
      </motion.div>
      
      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Sentiment Card */}
          <motion.div 
            className={`col-span-1 p-6 rounded-lg border ${getSentimentColor('bg')} ${getSentimentColor('border')} ${getSentimentColor('text')} flex flex-col items-center justify-center`}
            variants={itemVariants}
          >
            <div className="mb-4">
              {getSentimentIcon()}
            </div>
            <h3 className="text-xl font-bold capitalize mb-1">{sentiment}</h3>
            <p className="text-sm opacity-80">Overall Sentiment</p>
          </motion.div>
          
          {/* Confidence Meter */}
          <motion.div 
            className="col-span-1 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col items-center justify-center"
            variants={itemVariants}
          >
            <div className="w-24 h-24 relative mb-2">
              <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="absolute top-0 left-0 flex items-center justify-center w-full h-full text-xl font-bold text-gray-800 dark:text-white"
                >
                  {confidencePercentage}%
                </div>
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={sentiment === 'positive' ? '#8B5CF6' : sentiment === 'negative' ? '#EF4444' : '#6366F1'}
                    strokeWidth="3"
                    strokeDasharray={`${confidencePercentage}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Confidence</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Analysis certainty</p>
          </motion.div>
          
          {/* Key Aspects Summary */}
          <motion.div 
            className="col-span-1 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Top Aspects</h3>
            {aspect_analysis && Object.entries(aspect_analysis).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(aspect_analysis)
                  .sort((a, b) => b[1].score - a[1].score)
                  .slice(0, 3)
                  .map(([aspect, data]) => {
                    const aspectScore = Math.round(data.score * 100);
                    return (
                      <div key={aspect} className="flex items-center gap-2">
                        {getAspectIcon(aspect)}
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{aspect}</span>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{aspectScore}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                            <div 
                              className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600" 
                              style={{ width: `${aspectScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No aspect data available</p>
            )}
          </motion.div>
          
          {/* Key Phrases Section */}
          {key_phrases && key_phrases.length > 0 && (
            <motion.div 
              className="col-span-1 md:col-span-3 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Key Phrases</h3>
              <div className="flex flex-wrap gap-2">
                {key_phrases.map((phrase, index) => (
                  <span 
                    key={index} 
                    className={`px-3 py-1 rounded-full text-sm ${
                      sentiment === 'positive' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 
                      sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                    }`}
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {/* Details Tab */}
      {activeTab === 'details' && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Detailed Sentiment Analysis */}
          <motion.div 
            className="col-span-1 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Sentiment Details</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sentiment Type</span>
                  <span className={`text-sm font-medium capitalize ${getSentimentColor('text')}`}>{sentiment}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {sentiment === 'positive' ? 
                    'The review expresses favorable opinions about the movie.' : 
                    sentiment === 'negative' ? 
                    'The review expresses unfavorable opinions about the movie.' : 
                    'The review expresses mixed or neutral opinions about the movie.'}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Confidence Score</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{confidencePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className={`h-2 rounded-full ${
                      sentiment === 'positive' ? 'bg-purple-600' : 
                      sentiment === 'negative' ? 'bg-red-600' : 
                      'bg-indigo-600'
                    }`} 
                    style={{ width: `${confidencePercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {confidencePercentage > 80 ? 
                    'Very high confidence in this sentiment classification.' : 
                    confidencePercentage > 60 ? 
                    'Good confidence in this sentiment classification.' : 
                    'Moderate confidence in this sentiment classification.'}
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analysis Method</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">
                    &apos;Deep Learning Model&apos;
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Analysis performed using trained neural network on IMDB dataset
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Key Phrases Analysis */}
          <motion.div 
            className="col-span-1 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            variants={itemVariants}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Key Phrases Analysis</h3>
            {key_phrases && key_phrases.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The following phrases were identified as significant in determining the sentiment:
                </p>
                <ul className="space-y-2">
                  {key_phrases.map((phrase, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full mt-1.5 ${
                        sentiment === 'positive' ? 'bg-purple-500' : 
                        sentiment === 'negative' ? 'bg-red-500' : 
                        'bg-indigo-500'
                      }`}></span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No key phrases were identified in this review.</p>
            )}
          </motion.div>
          
          {/* Aspect Analysis */}
          {aspect_analysis && Object.keys(aspect_analysis).length > 0 && (
            <motion.div 
              className="col-span-1 md:col-span-2 p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              variants={itemVariants}
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Aspect Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(aspect_analysis).map(([aspect, data]) => {
                  const aspectScore = Math.round(data.score * 100);
                  return (
                    <div 
                      key={aspect} 
                      className="border rounded-lg p-4 dark:border-gray-700 relative"
                      onMouseEnter={() => setShowTooltip(aspect)}
                      onMouseLeave={() => setShowTooltip(null)}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {getAspectIcon(aspect)}
                        <h4 className="font-medium text-gray-800 dark:text-white">{aspect}</h4>
                        <div className="relative ml-1">
                          <FaInfoCircle 
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" 
                            size={14} 
                          />
                          {showTooltip === aspect && (
                            <div className="absolute z-10 w-64 p-2 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 -left-32 top-6">
                              {getAspectDescription(aspect)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Score</span>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{aspectScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div 
                            className={`h-2.5 rounded-full ${
                              aspectScore > 66 ? 'bg-green-500' : 
                              aspectScore < 33 ? 'bg-red-500' : 
                              'bg-yellow-500'
                            }`} 
                            style={{ width: `${aspectScore}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {data.keywords && data.keywords.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Related Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {data.keywords.map((keyword, idx) => (
                              <span 
                                key={idx} 
                                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
      
      {/* Visualizations Tab */}
      {activeTab === 'visualizations' && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <SentimentVisualizations result={result} movieTitle={movieTitle} />
        </motion.div>
      )}
    </motion.div>
  );
}