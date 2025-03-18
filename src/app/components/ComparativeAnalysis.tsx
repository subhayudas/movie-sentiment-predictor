'use client';

import { useState, useRef } from 'react';
import { analyzeSentiment } from '../api/sentimentService';
import { FaPlus, FaTrash, FaExchangeAlt, FaDownload, FaChartBar, FaTable, FaInfoCircle } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { motion, AnimatePresence } from 'framer-motion';
import { saveAs } from 'file-saver';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ComparisonItem {
  id: string;
  movieTitle: string;
  review: string;
  sentiment?: string;
  confidence?: number;
  error?: string;
}

export default function ComparativeAnalysis() {
  const [items, setItems] = useState<ComparisonItem[]>([
    { id: '1', movieTitle: '', review: '' },
    { id: '2', movieTitle: '', review: '' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<ComparisonItem[]>([]);
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleAddItem = () => {
    setItems([...items, { 
      id: Date.now().toString(), 
      movieTitle: '', 
      review: '' 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 2) {
      setError('You need at least two items for comparison');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: 'movieTitle' | 'review', value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleCompare = async () => {
    // Validate inputs
    const emptyFields = items.some(item => !item.review.trim());
    if (emptyFields) {
      setError('All review fields are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const analysisPromises = items.map(async (item) => {
        try {
          const result = await analyzeSentiment({
            review: item.review,
            movieTitle: item.movieTitle
          });
        
          return {
            ...item,
            sentiment: result.sentiment,
            confidence: result.confidence
          };
        } catch (itemError) {
          console.error(`Error analyzing item ${item.id}:`, itemError);
          // Return item with error state
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
      }
    } catch (err) {
      setError('An error occurred during analysis. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment?: string, opacity: number = 1) => {
    if (!sentiment) return 'bg-gray-200';
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return `rgba(34, 197, 94, ${opacity})`;
      case 'negative': return `rgba(239, 68, 68, ${opacity})`;
      case 'neutral': return `rgba(99, 102, 241, ${opacity})`;
      case 'error': return `rgba(234, 179, 8, ${opacity})`;
      default: return `rgba(107, 114, 128, ${opacity})`;
    }
  };

  const getSentimentBgClass = (sentiment?: string) => {
    if (!sentiment) return 'bg-gray-200 dark:bg-gray-700';
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-500';
      case 'negative': return 'bg-red-500';
      case 'neutral': return 'bg-indigo-500';
      case 'error': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getSentimentTextClass = (sentiment?: string) => {
    if (!sentiment) return 'text-gray-700 dark:text-gray-300';
    
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'text-green-700 dark:text-green-300';
      case 'negative': return 'text-red-700 dark:text-red-300';
      case 'neutral': return 'text-indigo-700 dark:text-indigo-300';
      case 'error': return 'text-yellow-700 dark:text-yellow-300';
      default: return 'text-gray-700 dark:text-gray-300';
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Movie Title', 'Review Text', 'Sentiment', 'Confidence'];
    const csvRows = [
      headers.join(','),
      ...results.map(item => {
        const movieTitle = item.movieTitle ? `"${item.movieTitle.replace(/"/g, '""')}"` : '';
        const review = `"${item.review.replace(/"/g, '""')}"`;
        const sentiment = item.sentiment || '';
        const confidence = item.confidence ? (item.confidence * 100).toFixed(1) + '%' : '';
        return [movieTitle, review, sentiment, confidence].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'sentiment_comparison.csv');
  };

  const exportAsImage = () => {
    if (!chartRef.current || results.length === 0) return;
    
    // Use html2canvas or similar library to capture chart as image
    // For this example, we'll just show a placeholder implementation
    alert('Chart image export functionality would be implemented here');
  };

  // Prepare chart data
  const chartData = {
    labels: results.map(result => result.movieTitle || `Review ${results.indexOf(result) + 1}`),
    datasets: [
      {
        label: 'Confidence Score',
        data: results.map(result => result.confidence ? result.confidence * 100 : 0),
        backgroundColor: results.map(result => getSentimentColor(result.sentiment, 0.7)),
        borderColor: results.map(result => getSentimentColor(result.sentiment, 1)),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.8)',
          font: {
            family: "'Inter', sans-serif",
          }
        }
      },
      title: {
        display: true,
        text: 'Sentiment Confidence Comparison',
        color: 'rgba(255, 255, 255, 0.9)',
        font: {
          size: 16,
          weight: 'bold',
          family: "'Inter', sans-serif",
        }
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleFont: {
          family: "'Inter', sans-serif",
        },
        bodyFont: {
          family: "'Inter', sans-serif",
        },
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const index = context.dataIndex;
            const sentiment = results[index]?.sentiment || 'Unknown';
            return [`${label}: ${value.toFixed(1)}%`, `Sentiment: ${sentiment}`];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: "'Inter', sans-serif",
          }
        },
        title: {
          display: true,
          text: 'Confidence (%)',
          color: 'rgba(255, 255, 255, 0.9)',
          font: {
            family: "'Inter', sans-serif",
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: "'Inter', sans-serif",
          },
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  };

  // Get sentiment distribution
  const getSentimentDistribution = () => {
    if (results.length === 0) return { positive: 0, negative: 0, neutral: 0, error: 0 };
    
    return results.reduce((acc, result) => {
      const sentiment = result.sentiment?.toLowerCase() || 'error';
      acc[sentiment as keyof typeof acc] = (acc[sentiment as keyof typeof acc] || 0) + 1;
      return acc;
    }, { positive: 0, negative: 0, neutral: 0, error: 0 });
  };

  const distribution = getSentimentDistribution();

  return (
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <FaExchangeAlt className="mr-2" />
          Comparative Sentiment Analysis
        </h2>
        
        {results.length > 0 && (
          <div className="flex space-x-2">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
            >
              <FaDownload size={14} />
              <span>Export CSV</span>
            </button>
            
            <button 
              onClick={exportAsImage}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
            >
              <FaChartBar size={14} />
              <span>Export Chart</span>
            </button>
          </div>
        )}
      </div>
      
      <p className="text-indigo-200 mb-6 max-w-3xl">
        Compare sentiment across multiple movie reviews to identify patterns and differences. 
        Add reviews with their titles, analyze them simultaneously, and visualize the results.
      </p>
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 text-red-200 rounded-lg flex items-center">
          <FaInfoCircle className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div 
                key={item.id} 
                className="p-4 bg-indigo-900/50 rounded-lg border border-indigo-500/40 hover:border-indigo-400/60 transition-all"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-white font-medium flex items-center">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mr-2 text-sm">
                      {index + 1}
                    </span>
                    Review Comparison Item
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-indigo-300 hover:text-red-400 transition-colors p-1"
                    aria-label="Remove item"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-xs text-indigo-300 mb-1 font-medium">Movie Title</label>
                    <input
                      type="text"
                      value={item.movieTitle}
                      onChange={(e) => handleItemChange(item.id, 'movieTitle', e.target.value)}
                      placeholder="Movie title (optional)"
                      className="w-full px-3 py-2 bg-indigo-900/60 border border-indigo-500/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-indigo-400"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-indigo-300 mb-1 font-medium">Review Text</label>
                    <textarea
                      value={item.review}
                      onChange={(e) => handleItemChange(item.id, 'review', e.target.value)}
                      placeholder="Enter review text"
                      rows={2}
                      className="w-full px-3 py-2 bg-indigo-900/60 border border-indigo-500/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-indigo-400"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-3 border-2 border-dashed border-indigo-500/40 rounded-lg text-indigo-300 hover:bg-indigo-800/40 transition-colors flex items-center justify-center"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Add Another Review
          </button>
          
          <button
            type="button"
            onClick={handleCompare}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyzing Reviews...
              </span>
            ) : (
              <span className="flex items-center">
                <FaExchangeAlt className="h-5 w-5 mr-2" />
                Compare Reviews
              </span>
            )}
          </button>
        </div>
        
        {/* Sidebar with tips or summary */}
        <div className="bg-indigo-900/40 rounded-lg border border-indigo-500/30 p-4">
          <h3 className="text-lg font-medium text-white mb-3">Analysis Tips</h3>
          <ul className="space-y-2 text-indigo-200 text-sm">
            <li className="flex items-start">
              <span className="bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs mr-2 mt-0.5">1</span>
              <span>Add at least two reviews to compare their sentiment analysis results</span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs mr-2 mt-0.5">2</span>
              <span>Include movie titles for better organization and visualization</span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs mr-2 mt-0.5">3</span>
              <span>Reviews should be at least 20 characters for more accurate analysis</span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs mr-2 mt-0.5">4</span>
              <span>Export results as CSV for further analysis in spreadsheet software</span>
            </li>
          </ul>
          
          {results.length > 0 && (
            <div className="mt-6">
              <h4 className="text-white font-medium mb-2">Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-green-300 text-sm">Positive:</span>
                  <span className="text-white font-medium">{distribution.positive}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-300 text-sm">Negative:</span>
                  <span className="text-white font-medium">{distribution.negative}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-indigo-300 text-sm">Neutral:</span>
                  <span className="text-white font-medium">{distribution.neutral}</span>
                </div>
                {distribution.error > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-300 text-sm">Failed:</span>
                    <span className="text-white font-medium">{distribution.error}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t border-indigo-500/30">
                <div className="flex justify-between text-xs text-indigo-300 mb-1">
                  <span>Sentiment Distribution</span>
                </div>
                <div className="h-4 bg-indigo-900/50 rounded-full overflow-hidden flex">
                  {distribution.positive > 0 && (
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ width: `${(distribution.positive / results.length) * 100}%` }}
                      title={`Positive: ${distribution.positive}`}
                    ></div>
                  )}
                  {distribution.neutral > 0 && (
                    <div 
                      className="bg-indigo-500 h-full" 
                      style={{ width: `${(distribution.neutral / results.length) * 100}%` }}
                      title={`Neutral: ${distribution.neutral}`}
                    ></div>
                  )}
                  {distribution.negative > 0 && (
                    <div 
                      className="bg-red-500 h-full" 
                      style={{ width: `${(distribution.negative / results.length) * 100}%` }}
                      title={`Negative: ${distribution.negative}`}
                    ></div>
                  )}
                  {distribution.error > 0 && (
                    <div 
                      className="bg-yellow-500 h-full" 
                      style={{ width: `${(distribution.error / results.length) * 100}%` }}
                      title={`Error: ${distribution.error}`}
                    ></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {results.length > 0 && (
        <div className="mt-8 bg-indigo-900/30 rounded-lg border border-indigo-500/30 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Comparison Results</h3>
            
            <div className="flex bg-indigo-900/50 rounded-md overflow-hidden">
              <button
                onClick={() => setActiveView('chart')}
                className={`px-4 py-2 text-sm font-medium ${activeView === 'chart' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:bg-indigo-800/50'}`}
              >
                <FaChartBar className="inline mr-1" /> Chart View
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`px-4 py-2 text-sm font-medium ${activeView === 'table' ? 'bg-indigo-600 text-white' : 'text-indigo-300 hover:bg-indigo-800/50'}`}
              >
                <FaTable className="inline mr-1" /> Table View
              </button>
            </div>
          </div>
          
          {activeView === 'chart' ? (
            <div className="h-80 w-full relative" ref={chartRef}>
              {results.length > 0 ? (
                <div className="w-full h-full">
                  <canvas 
                    id="sentiment-comparison-chart"
                    ref={(canvas) => {
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          // Clear any existing chart
                          const existingChart = ChartJS.getChart(canvas);
                          if (existingChart) existingChart.destroy();
                          
                          new ChartJS(ctx, {
                            type: 'bar',
                            data: chartData,
                            options: {
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                  labels: {
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    font: {
                                      family: "'Inter', sans-serif",
                                    }
                                  }
                                },
                                title: {
                                  display: true,
                                  text: 'Sentiment Confidence Comparison',
                                  color: 'rgba(255, 255, 255, 0.9)',
                                  font: {
                                    size: 16,
                                    weight: 'bold',
                                    family: "'Inter', sans-serif",
                                  }
                                },
                                tooltip: {
                                  backgroundColor: 'rgba(30, 41, 59, 0.9)',
                                  titleFont: {
                                    family: "'Inter', sans-serif",
                                  },
                                  bodyFont: {
                                    family: "'Inter', sans-serif",
                                  },
                                  callbacks: {
                                    label: function(context) {
                                      const label = context.dataset.label || '';
                                      const value = context.parsed.y;
                                      const index = context.dataIndex;
                                      const sentiment = results[index]?.sentiment || 'Unknown';
                                      return [`${label}: ${value.toFixed(1)}%`, `Sentiment: ${sentiment}`];
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  max: 100,
                                  grid: {
                                    color: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  ticks: {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    font: {
                                      family: "'Inter', sans-serif",
                                    }
                                  },
                                  title: {
                                    display: true,
                                    text: 'Confidence (%)',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    font: {
                                      family: "'Inter', sans-serif",
                                    }
                                  }
                                },
                                x: {
                                  grid: {
                                    color: 'rgba(255, 255, 255, 0.1)',
                                  },
                                  ticks: {
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    font: {
                                      family: "'Inter', sans-serif",
                                    },
                                    maxRotation: 45,
                                    minRotation: 45
                                  }
                                }
                              }
                            }
                          });
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-indigo-300">
                  No data to display
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-indigo-500/30">
                    <th className="px-4 py-3 text-indigo-300 font-medium">Movie</th>
                    <th className="px-4 py-3 text-indigo-300 font-medium">Sentiment</th>
                    <th className="px-4 py-3 text-indigo-300 font-medium">Confidence</th>
                    <th className="px-4 py-3 text-indigo-300 font-medium">Review Excerpt</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, index) => (
                    <tr key={result.id} className={index % 2 === 0 ? 'bg-indigo-900/20' : 'bg-indigo-900/10'}>
                      <td className="px-4 py-3 text-white font-medium">
                        {result.movieTitle || `Review ${index + 1}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full mr-2 ${getSentimentBgClass(result.sentiment)}`}></span>
                          <span className={`${getSentimentTextClass(result.sentiment)} font-medium`}>
                            {result.sentiment ? result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1) : 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {result.confidence ? (
                          <div className="flex items-center">
                            <div className="w-24 bg-indigo-900/50 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${getSentimentBgClass(result.sentiment)}`}
                                style={{ width: `${result.confidence * 100}%` }}
                              ></div>
                            </div>
                            <span>{(result.confidence * 100).toFixed(1)}%</span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-indigo-200">
                        <div className="relative" onMouseEnter={() => setShowTooltip(result.id)} onMouseLeave={() => setShowTooltip(null)}>
                          {result.review.length > 50 ? `${result.review.substring(0, 50)}...` : result.review}
                          
                          {showTooltip === result.id && (
                            <div className="absolute z-10 w-64 p-3 bg-indigo-800 rounded-lg shadow-lg text-white text-sm left-0 top-full mt-1">
                              {result.review}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-indigo-500/30">
            <h4 className="text-lg font-medium text-white mb-4">Sentiment Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Positive Reviews */}
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-green-300 font-medium">Positive Reviews</h5>
                  <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {distribution.positive}
                  </span>
                </div>
                <p className="text-green-200 text-sm">
                  {distribution.positive > 0 
                    ? `${Math.round((distribution.positive / results.length) * 100)}% of reviews express positive sentiment.`
                    : 'No positive reviews detected.'}
                </p>
              </div>
              
              {/* Negative Reviews */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-red-300 font-medium">Negative Reviews</h5>
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {distribution.negative}
                  </span>
                </div>
                <p className="text-red-200 text-sm">
                  {distribution.negative > 0 
                    ? `${Math.round((distribution.negative / results.length) * 100)}% of reviews express negative sentiment.`
                    : 'No negative reviews detected.'}
                </p>
              </div>
              
              {/* Neutral Reviews */}
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-indigo-300 font-medium">Neutral Reviews</h5>
                  <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {distribution.neutral}
                  </span>
                </div>
                <p className="text-indigo-200 text-sm">
                  {distribution.neutral > 0 
                    ? `${Math.round((distribution.neutral / results.length) * 100)}% of reviews express neutral sentiment.`
                    : 'No neutral reviews detected.'}
                </p>
              </div>
              
              {/* Average Confidence */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-purple-300 font-medium">Average Confidence</h5>
                  <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {results.filter(r => r.confidence !== undefined).length > 0 
                      ? `${(results.reduce((sum, item) => sum + (item.confidence || 0), 0) / results.filter(r => r.confidence !== undefined).length * 100).toFixed(1)}%`
                      : 'N/A'}
                  </span>
                </div>
                <p className="text-purple-200 text-sm">
                  Average confidence score across all analyzed reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}