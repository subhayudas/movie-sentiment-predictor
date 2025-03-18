'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaPlus, FaTrash, FaStar, FaRegStar, FaStarHalfAlt, FaFilm, FaChartPie, FaInfoCircle, FaDownload } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { analyzeSentiment } from '../api/sentimentService';
import { saveAs } from 'file-saver';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface ReviewItem {
  id: string;
  reviewerName: string;
  review: string;
  sentiment?: string;
  confidence?: number;
  error?: string;
  aspectScores?: {
    [key: string]: {
      score: number;
      keywords: string[];
    };
  };
}

interface MovieRatingAggregatorProps {
  onSave?: (data: {
    movieTitle: string;
    aggregateScore: number;
    reviews: ReviewItem[];
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }) => void;
}

export default function MovieRatingAggregator({ onSave }: MovieRatingAggregatorProps) {
  const [movieTitle, setMovieTitle] = useState('');
  const [reviews, setReviews] = useState<ReviewItem[]>([
    { id: uuidv4(), reviewerName: '', review: '' }
  ]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ReviewItem[]>([]);
  const [aggregateScore, setAggregateScore] = useState(0);
  const [activeTab, setActiveTab] = useState<'reviews' | 'results'>('reviews');
  const [showTips, setShowTips] = useState(false);
  
  // Add a new review form
  const handleAddReview = () => {
    setReviews([...reviews, { 
      id: uuidv4(), 
      reviewerName: '', 
      review: '' 
    }]);
  };

  // Remove a review form
  const handleRemoveReview = (id: string) => {
    if (reviews.length <= 1) {
      setError('You need at least one review');
      return;
    }
    setReviews(reviews.filter(item => item.id !== id));
  };

  // Update review form fields
  const handleReviewChange = (id: string, field: 'reviewerName' | 'review', value: string) => {
    setReviews(reviews.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Calculate aggregate score based on sentiment analysis results
  useEffect(() => {
    if (results.length === 0) return;

    // Calculate weighted score based on sentiment and confidence
    let totalScore = 0;
    let totalWeight = 0;

    results.forEach(result => {
      if (!result.sentiment || !result.confidence) return;
      
      const weight = result.confidence; // Changed from let to const since it's never reassigned
      let score = 0;
      
      // Convert sentiment to score (0-10 scale)
      if (result.sentiment === 'positive') {
        score = 7 + (result.confidence * 3); // 7-10 range for positive
      } else if (result.sentiment === 'negative') {
        score = 3 * (1 - result.confidence); // 0-3 range for negative
      } else { // neutral
        score = 3 + (result.confidence * 4); // 3-7 range for neutral
      }
      
      totalScore += score * weight;
      totalWeight += weight;
    });

    // Calculate final weighted average
    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    setAggregateScore(finalScore);
  }, [results]);

  // Analyze all reviews
  const handleAnalyzeReviews = async () => {
    // Validate inputs
    if (!movieTitle.trim()) {
      setError('Movie title is required');
      return;
    }

    const emptyReviews = reviews.some(item => !item.review.trim());
    if (emptyReviews) {
      setError('All review fields are required');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setResults([]);

    try {
      const analysisPromises = reviews.map(async (item) => {
        try {
          const result = await analyzeSentiment({
            review: item.review,
            movieTitle: movieTitle
          });
        
          return {
            ...item,
            sentiment: result.sentiment,
            confidence: result.confidence,
            aspectScores: result.aspect_analysis
          };
        } catch (itemError) {
          console.error(`Error analyzing review ${item.id}:`, itemError);
          return {
            ...item,
            sentiment: 'error',
            confidence: 0,
            error: 'Analysis failed'
          };
        }
      });
    
      const analysisResults = await Promise.all(analysisPromises);
      setResults(analysisResults);
      
      // Check if any analyses failed
      const failedAnalyses = analysisResults.filter(result => result.sentiment === 'error');
      if (failedAnalyses.length > 0) {
        setError(`${failedAnalyses.length} of ${analysisResults.length} analyses failed. Results may be incomplete.`);
      } else {
        setActiveTab('results');
      }
    } catch (err) {
      setError('An error occurred during analysis. Please try again.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get sentiment distribution
  const getSentimentDistribution = () => {
    if (results.length === 0) return { positive: 0, negative: 0, neutral: 0 };
    
    return results.reduce((acc, result) => {
      const sentiment = result.sentiment?.toLowerCase();
      if (sentiment === 'positive') acc.positive += 1;
      else if (sentiment === 'negative') acc.negative += 1;
      else if (sentiment === 'neutral') acc.neutral += 1;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0 });
  };

  // Get aspect analysis data
  const getAspectAnalysisData = () => {
    if (results.length === 0) return { labels: [], data: [] };
    
    // Collect all unique aspects
    const aspectMap: Record<string, number[]> = {};
    
    results.forEach(result => {
      if (!result.aspectScores) return;
      
      Object.entries(result.aspectScores).forEach(([aspect, { score }]) => {
        if (!aspectMap[aspect]) {
          aspectMap[aspect] = [];
        }
        aspectMap[aspect].push(score);
      });
    });
    
    // Calculate average score for each aspect
    const aspects = Object.keys(aspectMap);
    const averageScores = aspects.map(aspect => {
      const scores = aspectMap[aspect];
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    });
    
    return {
      labels: aspects,
      data: averageScores.map(score => score * 10) // Convert to 0-10 scale
    };
  };

  // Render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = (rating % 2) >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-400" />);
      }
    }
    
    return stars;
  };

  // Get color for sentiment
  const getSentimentColor = (sentiment?: string, opacity: number = 1) => {
    if (!sentiment) return `rgba(107, 114, 128, ${opacity})`;
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return `rgba(34, 197, 94, ${opacity})`;
      case 'negative': return `rgba(239, 68, 68, ${opacity})`;
      case 'neutral': return `rgba(99, 102, 241, ${opacity})`;
      default: return `rgba(107, 114, 128, ${opacity})`;
    }
  };

  // Export results to CSV
  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Reviewer', 'Review Text', 'Sentiment', 'Confidence'];
    const csvRows = [
      headers.join(','),
      ...results.map(item => {
        const reviewer = item.reviewerName ? `"${item.reviewerName.replace(/"/g, '""')}"` : '';
        const review = `"${item.review.replace(/"/g, '""')}"`;
        const sentiment = item.sentiment || '';
        const confidence = item.confidence ? (item.confidence * 100).toFixed(1) + '%' : '';
        return [reviewer, review, sentiment, confidence].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${movieTitle.replace(/\s+/g, '_')}_ratings.csv`);
  };

  // Update the handleSaveResults function in the MovieRatingAggregator component:
  
  const handleSaveResults = () => {
    if (results.length > 0) {
      try {
        // Remove the savedRating variable since it's not being used
        
        
        // If onSave prop exists, call it
        if (onSave) {
          onSave({
            movieTitle,
            aggregateScore,
            reviews: results,
            sentimentDistribution: getSentimentDistribution()
          });
        }
        
        // Trigger storage event to update SavedRatings component
        window.dispatchEvent(new Event('storage'));
        
        // Show success message
        setError('');
        alert(`Rating for "${movieTitle}" saved successfully!`);
        
        // Reset the form
        setActiveTab('reviews');
        setMovieTitle('');
        setReviews([{ id: uuidv4(), reviewerName: '', review: '' }]);
        setResults([]);
      } catch (err) {
        console.error('Error saving rating:', err);
        setError('Failed to save rating. Please try again.');
      }
    }
  };

  // Prepare chart data
  const distribution = getSentimentDistribution();
  const pieData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [distribution.positive, distribution.negative, distribution.neutral],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)', // Green for positive
          'rgba(239, 68, 68, 0.8)', // Red for negative
          'rgba(99, 102, 241, 0.8)', // Indigo for neutral
        ],
        borderColor: ['#22c55e', '#ef4444', '#6366f1'],
        borderWidth: 1,
      },
    ],
  };

  const aspectData = getAspectAnalysisData();
  const barData = {
    labels: aspectData.labels,
    datasets: [
      {
        label: 'Aspect Ratings',
        data: aspectData.data,
        backgroundColor: 'rgba(147, 51, 234, 0.7)',
        borderColor: 'rgb(147, 51, 234)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaFilm className="mr-2" />
            Movie Rating Aggregator
          </h2>
          <p className="text-indigo-200 mt-1">
            Analyze multiple reviews to generate an aggregate movie rating
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/70 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
          >
            <FaInfoCircle size={14} />
            <span>Tips</span>
          </button>
          
          {results.length > 0 && (
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/70 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
            >
              <FaDownload size={14} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Tips Panel */}
      <AnimatePresence>
        {showTips && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-indigo-800/30 border border-indigo-500/30 rounded-lg p-4 text-indigo-200">
              <h3 className="font-medium text-white mb-2">Tips for Better Results:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Add at least 3-5 reviews for more accurate aggregate ratings</li>
                <li>Include reviewer names to track who provided which feedback</li>
                <li>Provide detailed reviews (50+ words) for better sentiment analysis</li>
                <li>Include specific aspects like acting, plot, visuals in reviews</li>
                <li>The final score is weighted based on confidence levels</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 text-red-200 rounded-lg flex items-center">
          <FaInfoCircle className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-indigo-500/30 mb-6">
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'reviews' 
              ? 'text-white border-b-2 border-purple-500' 
              : 'text-indigo-300 hover:text-white'
          }`}
          onClick={() => setActiveTab('reviews')}
        >
          Add Reviews
        </button>
        <button
          className={`py-2 px-4 font-medium text-sm ${
            activeTab === 'results' 
              ? 'text-white border-b-2 border-purple-500' 
              : 'text-indigo-300 hover:text-white'
          }`}
          onClick={() => setActiveTab('results')}
          disabled={results.length === 0}
        >
          Results
        </button>
      </div>
      
      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          <div className="mb-6">
            <label htmlFor="movieTitle" className="block text-sm font-medium text-white mb-1">
              Movie Title
            </label>
            <input
              type="text"
              id="movieTitle"
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
              placeholder="Enter movie title"
              className="w-full px-4 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder-white/40 transition-all"
              required
            />
          </div>
          
          <div className="space-y-6 mb-6">
            <h3 className="text-lg font-medium text-white">Reviews</h3>
            
            {reviews.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-indigo-900/40 border border-indigo-500/20 rounded-lg"
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-white">Review #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveReview(item.id)}
                    className="text-indigo-300 hover:text-red-400 transition-colors"
                    disabled={reviews.length <= 1}
                  >
                    <FaTrash />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-indigo-300 mb-1">
                      Reviewer Name (optional)
                    </label>
                    <input
                      type="text"
                      value={item.reviewerName}
                      onChange={(e) => handleReviewChange(item.id, 'reviewerName', e.target.value)}
                      placeholder="Name"
                      className="w-full px-3 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-md text-white placeholder-white/40"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-indigo-300 mb-1">
                      Review Text
                    </label>
                    <textarea
                      value={item.review}
                      onChange={(e) => handleReviewChange(item.id, 'review', e.target.value)}
                      placeholder="Write a detailed review..."
                      rows={3}
                      className="w-full px-3 py-2 bg-indigo-950/50 border border-indigo-500/30 rounded-md text-white placeholder-white/40"
                      required
                    />
                  </div>
                </div>
              </motion.div>
            ))}
            
            <button
              type="button"
              onClick={handleAddReview}
              className="w-full py-2 border border-dashed border-indigo-500/40 rounded-lg text-indigo-300 hover:text-white hover:border-indigo-500/70 hover:bg-indigo-900/30 transition-colors flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              Add Another Review
            </button>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAnalyzeReviews}
              disabled={isAnalyzing}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <FaChartPie className="mr-2" />
                  Analyze Reviews
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Results Tab */}
      {activeTab === 'results' && results.length > 0 && (
        <div>
          <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-bold text-white mb-1">{movieTitle}</h3>
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {renderStars(aggregateScore)}
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {aggregateScore.toFixed(1)}
                  </span>
                  <span className="text-indigo-300 ml-1">/10</span>
                </div>
                <p className="text-indigo-300 text-sm mt-1">
                  Based on {results.length} review{results.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="w-full md:w-48 h-48">
                <Pie data={pieData} options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          const label = context.label || '';
                          const value = context.raw as number;
                          const total = (context.dataset.data as number[]).reduce((a, b) => (a as number) + (b as number), 0);
                          const percentage = Math.round((value / total) * 100);
                          return `${label}: ${value} (${percentage}%)`;
                        }
                      }
                    }
                  }
                }} />
              </div>
            </div>
          </div>
          
          {/* Aspect Analysis */}
          {aspectData.labels.length > 0 && (
            <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Aspect Ratings</h3>
              <div className="h-64">
                <Bar 
                  data={barData} 
                  options={{
                    indexAxis: 'y' as const,
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        beginAtZero: true,
                        max: 10,
                        grid: {
                          color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      },
                      y: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: 'rgba(255, 255, 255, 0.7)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `Rating: ${context.raw}/10`;
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          )}
          
          {/* Individual Reviews */}
          <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Individual Reviews</h3>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div 
                  key={result.id}
                  className="p-4 bg-indigo-950/50 border border-indigo-500/20 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-white">
                        {result.reviewerName || `Reviewer #${index + 1}`}
                      </h4>
                      <div className="flex items-center mt-1">
                        <div 
                          className={`px-2 py-0.5 rounded text-xs font-medium mr-2`}
                          style={{ 
                            backgroundColor: getSentimentColor(result.sentiment, 0.3),
                            color: getSentimentColor(result.sentiment, 1)
                          }}
                        >
                          {result.sentiment || 'Unknown'}
                        </div>
                        <span className="text-indigo-300 text-xs">
                          {result.confidence 
                            ? `${(result.confidence * 100).toFixed(1)}% confidence` 
                            : 'No confidence score'}
                        </span>
                      </div>
                    </div>
                    <div className="flex">
                      {result.sentiment && renderStars(
                        result.sentiment === 'positive' 
                          ? 7 + ((result.confidence || 0) * 3)
                          : result.sentiment === 'negative'
                            ? 3 * (1 - (result.confidence || 0))
                            : 3 + ((result.confidence || 0) * 4)
                      )}
                    </div>
                  </div>
                  <p className="text-white/80 text-sm mt-2">{result.review}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              onClick={handleSaveResults}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center"
            >
              <FaStar className="mr-2" />
              Save Rating
            </button>
          </div>
        </div>
      )}
    </div>
  );
}