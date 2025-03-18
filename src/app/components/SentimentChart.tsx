'use client';

import { useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, TimeScale, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { FaDownload, FaTable, FaChartBar, FaCalendarAlt, FaFilter, FaSortAmountDown } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

interface ReviewWithResults {
  id: string;
  movieTitle?: string;
  sentiment: string;
  confidence: number;
  timestamp?: Date;
}

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  TimeScale,
  PointElement,
  LineElement,
  Title, 
  Tooltip, 
  Legend
);

interface SentimentChartProps {
  reviewHistory: ReviewWithResults[];
}

// Define types for chart.js tooltip callbacks
interface TooltipItem {
  raw: number;
  dataIndex: number;
  dataset: {
    data: number[];
  };
  label?: string;
}

// Define a type for chart tooltip context
interface TooltipContext {
  label?: string;
  raw: number;
  dataIndex: number;
  dataset: {
    data: number[];
  };
}

export default function SentimentChart({ reviewHistory }: SentimentChartProps) {
  const [sentimentCounts, setSentimentCounts] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [confidenceData, setConfidenceData] = useState<number[]>([]);
  const [movieTitles, setMovieTitles] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'details'>('overview');
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'sentiment'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  
  const chartRef = useRef<HTMLDivElement>(null);

  // Filter and sort the review history
  const getFilteredHistory = () => {
    let filtered = [...reviewHistory];
    
    // Apply sentiment filter
    if (filterSentiment !== 'all') {
      filtered = filtered.filter(review => review.sentiment === filterSentiment);
    }
    
    // Apply time range filter if timestamps are available
    if (timeRange !== 'all' && filtered.some(r => r.timestamp)) {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (timeRange) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(review => 
        review.timestamp ? new Date(review.timestamp) >= cutoffDate : true
      );
    }
    
    // Sort the filtered reviews
    filtered.sort((a, b) => {
      if (sortBy === 'date' && a.timestamp && b.timestamp) {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'confidence') {
        return sortOrder === 'asc' ? a.confidence - b.confidence : b.confidence - a.confidence;
      } else if (sortBy === 'sentiment') {
        return sortOrder === 'asc' 
          ? a.sentiment.localeCompare(b.sentiment) 
          : b.sentiment.localeCompare(a.sentiment);
      }
      return 0;
    });
    
    return filtered;
  };

  useEffect(() => {
    if (reviewHistory.length === 0) return;

    // Calculate sentiment counts
    const counts = reviewHistory.reduce(
      (acc, review) => {
        const sentiment = review.sentiment.toLowerCase();
        if (sentiment === 'positive') acc.positive += 1;
        else if (sentiment === 'negative') acc.negative += 1;
        else acc.neutral += 1;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    // Extract confidence values and movie titles for the bar chart
    // Only use the last 7 reviews for the bar chart to avoid overcrowding
    const recentReviews = [...reviewHistory].reverse().slice(0, 7).reverse();
    const confidences = recentReviews.map(review => Math.round(review.confidence * 100));
    const titles = recentReviews.map(review => review.movieTitle || `Review ${review.id.slice(0, 4)}`);

    setSentimentCounts(counts);
    setConfidenceData(confidences);
    setMovieTitles(titles);
  }, [reviewHistory]);

  // Pie chart data for sentiment distribution
  const pieData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [sentimentCounts.positive, sentimentCounts.negative, sentimentCounts.neutral],
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

  // Bar chart data for confidence scores
  const barData = {
    labels: movieTitles,
    datasets: [
      {
        label: 'Confidence Score (%)',
        data: confidenceData,
        backgroundColor: movieTitles.map((_, i) => {
          const review = [...reviewHistory].reverse().slice(0, 7).reverse()[i];
          if (review?.sentiment === 'positive') return 'rgba(34, 197, 94, 0.7)';
          if (review?.sentiment === 'negative') return 'rgba(239, 68, 68, 0.7)';
          return 'rgba(99, 102, 241, 0.7)';
        }),
        borderColor: movieTitles.map((_, i) => {
          const review = [...reviewHistory].reverse().slice(0, 7).reverse()[i];
          if (review?.sentiment === 'positive') return '#22c55e';
          if (review?.sentiment === 'negative') return '#ef4444';
          return '#6366f1';
        }),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Line chart for sentiment trends over time
  const getTrendData = () => {
    // Only use reviews with timestamps
    const reviewsWithDates = reviewHistory.filter(r => r.timestamp).sort((a, b) => {
      return new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime();
    });
    
    if (reviewsWithDates.length === 0) return null;
    
    const labels = reviewsWithDates.map(r => {
      const date = new Date(r.timestamp!);
      return `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;
    });
    
    const positiveData = reviewsWithDates.map((r, i, arr) => {
      // Calculate running percentage of positive reviews
      const currentIndex = i + 1;
      const positiveCount = arr.slice(0, currentIndex).filter(rev => rev.sentiment === 'positive').length;
      return (positiveCount / currentIndex) * 100;
    });
    
    const negativeData = reviewsWithDates.map((r, i, arr) => {
      const currentIndex = i + 1;
      const negativeCount = arr.slice(0, currentIndex).filter(rev => rev.sentiment === 'negative').length;
      return (negativeCount / currentIndex) * 100;
    });
    
    return {
      labels,
      datasets: [
        {
          label: 'Positive Trend (%)',
          data: positiveData,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Negative Trend (%)',
          data: negativeData,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3,
        }
      ]
    };
  };

  const trendData = getTrendData();

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem) {
            const label = context.label || '';
            const value = context.raw;
            const total = (context.dataset.data).reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          color: '#6B7280',
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: 'Confidence Scores by Review',
        font: {
          family: "'Inter', sans-serif",
          size: 16,
          weight: 'bold'
        },
        color: '#374151',
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function(context: TooltipItem) {
            const sentiment = [...reviewHistory].reverse().slice(0, 7).reverse()[context.dataIndex]?.sentiment;
            return [`Confidence: ${context.raw}%`, `Sentiment: ${sentiment || 'Unknown'}`];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Confidence (%)',
          font: {
            family: "'Inter', sans-serif",
            size: 13
          },
          color: '#6B7280',
        },
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          color: '#6B7280',
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Sentiment Trends Over Time',
        font: {
          family: "'Inter', sans-serif",
          size: 16,
          weight: 'bold'
        },
        color: '#374151',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
      },
    },
    animation: {
      duration: 1000,
    }
  };

  const exportToCSV = () => {
    if (reviewHistory.length === 0) return;

    const headers = ['Movie Title', 'Sentiment', 'Confidence (%)', 'Date'];
    const csvRows = [
      headers.join(','),
      ...getFilteredHistory().map(item => {
        const movieTitle = item.movieTitle ? `"${item.movieTitle.replace(/"/g, '""')}"` : 'Untitled';
        const sentiment = item.sentiment || 'Unknown';
        const confidence = Math.round(item.confidence * 100);
        const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A';
        return [movieTitle, sentiment, confidence, date].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'sentiment_analysis_history.csv');
  };

  const exportAsImage = async () => {
    if (!chartRef.current || reviewHistory.length === 0) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'sentiment_analysis_chart.png';
      link.click();
    } catch (error) {
      console.error('Error exporting chart as image:', error);
    }
  };

  if (reviewHistory.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Analysis History</h2>
        <div className="py-12 px-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-gray-600 dark:text-gray-400 mb-2">No analysis history available yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">Submit a review to see your analysis history and trends.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <FaChartBar className="mr-2 text-indigo-600 dark:text-indigo-400" />
            Sentiment Analysis History
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Track and analyze your review sentiment patterns over time
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
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
            <FaDownload size={14} />
            <span>Export Image</span>
          </button>
        </div>
      </div>
      
      {/* Filters and Controls */}
      <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">View</label>
          <div className="flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1.5 text-sm ${
                activeView === 'overview' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('trends')}
              className={`px-3 py-1.5 text-sm ${
                activeView === 'trends' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Trends
            </button>
            <button
              onClick={() => setActiveView('details')}
              className={`px-3 py-1.5 text-sm ${
                activeView === 'details' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Details
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Filter Sentiment</label>
          <select
            value={filterSentiment}
            onChange={(e) => setFilterSentiment(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive Only</option>
            <option value="negative">Negative Only</option>
            <option value="neutral">Neutral Only</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Time</option>
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="year">Past Year</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Sort By</label>
          <div className="flex items-center">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-md text-gray-700 dark:text-gray-300"
            >
              <option value="date">Date</option>
              <option value="confidence">Confidence</option>
              <option value="sentiment">Sentiment</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-l-0 border-gray-200 dark:border-gray-700 rounded-r-md text-gray-700 dark:text-gray-300"
            >
              <FaSortAmountDown className={`transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Charts Section */}
      <div ref={chartRef} className="bg-white dark:bg-gray-800 rounded-lg p-4">
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Sentiment Distribution</h3>
              <div className="h-64">
                <Pie 
                  data={pieData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: {
                            family: "'Inter', sans-serif",
                            size: 12
                          },
                          usePointStyle: true,
                          padding: 20
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.raw as number;
                            const total = (context.dataset.data as number[]).reduce((a, b) => (a as number) + (b as number), 0) as number;
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    animation: {
                      animateRotate: true,
                      animateScale: true
                    }
                  }} 
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sentimentCounts.positive}</div>
                  <div className="text-xs text-green-800 dark:text-green-300">Positive</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{sentimentCounts.negative}</div>
                  <div className="text-xs text-red-800 dark:text-red-300">Negative</div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{sentimentCounts.neutral}</div>
                  <div className="text-xs text-indigo-800 dark:text-indigo-300">Neutral</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Recent Reviews Confidence</h3>
              <div className="h-64">
                <Bar 
                  data={barData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          font: { family: "'Inter', sans-serif", size: 12 },
                          color: '#6B7280',
                          usePointStyle: true,
                        }
                      },
                      title: {
                        display: true,
                        text: 'Confidence Scores by Review',
                        font: { family: "'Inter', sans-serif", size: 16, weight: 'bold' },
                        color: '#374151',
                        padding: { top: 10, bottom: 20 }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.8)',
                        titleFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
                        bodyFont: { family: "'Inter', sans-serif", size: 13 },
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                          label: function(context: any) {
                            const sentiment = [...reviewHistory].reverse().slice(0, 7).reverse()[context.dataIndex]?.sentiment;
                            return [`Confidence: ${context.raw}%`, `Sentiment: ${sentiment || 'Unknown'}`];
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Confidence (%)',
                          font: { family: "'Inter', sans-serif", size: 13 },
                          color: '#6B7280',
                        },
                        grid: { color: 'rgba(243, 244, 246, 0.8)' },
                      },
                      x: {
                        grid: { display: false },
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                          font: { family: "'Inter', sans-serif", size: 11 },
                          color: '#6B7280',
                        }
                      }
                    },
                    animation: {
                      duration: 1000,
                      easing: 'easeOutQuart'
                    }
                  }}
                />
              </div>
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Showing confidence scores for the {movieTitles.length} most recent reviews
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'trends' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Sentiment Trends Over Time</h3>
            {trendData ? (
              <div className="h-80">
                <Bar 
                  data={{
                    ...trendData,
                    datasets: trendData.datasets.map(dataset => ({
                      ...dataset,
                      backgroundColor: dataset.borderColor.replace('1)', '0.2)'),
                      fill: true,
                      borderWidth: 2,
                    }))
                  }} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          font: {
                            family: "'Inter', sans-serif",
                            size: 12
                          },
                          usePointStyle: true,
                        }
                      },
                      title: {
                        display: true,
                        text: 'Sentiment Trends Over Time',
                        font: {
                          family: "'Inter', sans-serif",
                          size: 16,
                          weight: 'bold'
                        },
                        color: '#374151',
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Percentage (%)',
                          font: {
                            family: "'Inter', sans-serif",
                          }
                        },
                        grid: {
                          color: 'rgba(243, 244, 246, 0.8)',
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        }
                      }
                    },
                    animation: {
                      duration: 1000,
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  Not enough timestamped data to show trends
                </p>
              </div>
            )}
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              This chart shows how your sentiment analysis results have changed over time
            </div>
          </div>
        )}
        
        {activeView === 'details' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Detailed Analysis History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Movie Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sentiment
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getFilteredHistory().map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {review.movieTitle || 'Untitled Review'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          review.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          review.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                          'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                        }`}>
                          {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                          <div 
                            className={`h-2.5 rounded-full ${
                              review.sentiment === 'positive' ? 'bg-green-500' :
                              review.sentiment === 'negative' ? 'bg-red-500' :
                              'bg-indigo-500'
                            }`}
                            style={{ width: `${Math.round(review.confidence * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{Math.round(review.confidence * 100)}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {review.timestamp ? new Date(review.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {getFilteredHistory().length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No reviews match your current filters
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{reviewHistory.length}</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Average Confidence</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {reviewHistory.length > 0 
              ? `${Math.round(reviewHistory.reduce((sum, review) => sum + review.confidence, 0) / reviewHistory.length * 100)}%` 
              : '0%'}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Dominant Sentiment</div>
          <div className="text-2xl font-bold mt-1">
            {sentimentCounts.positive >= sentimentCounts.negative && sentimentCounts.positive >= sentimentCounts.neutral ? (
              <span className="text-green-600 dark:text-green-400">Positive</span>
            ) : sentimentCounts.negative >= sentimentCounts.positive && sentimentCounts.negative >= sentimentCounts.neutral ? (
              <span className="text-red-600 dark:text-red-400">Negative</span>
            ) : (
              <span className="text-indigo-600 dark:text-indigo-400">Neutral</span>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Sentiment Ratio</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {reviewHistory.length > 0 
              ? `${Math.round(sentimentCounts.positive / reviewHistory.length * 100)}% / ${Math.round(sentimentCounts.negative / reviewHistory.length * 100)}%` 
              : '0% / 0%'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Positive / Negative</div>
        </div>
      </div>
      
      {/* Insights Section */}
      <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800/30">
        <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Analysis Insights</h3>
        <ul className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
          {reviewHistory.length > 0 && (
            <>
              <li>
                {sentimentCounts.positive > sentimentCounts.negative 
                  ? `Your reviews tend to be more positive (${Math.round(sentimentCounts.positive / reviewHistory.length * 100)}% positive sentiment).` 
                  : `Your reviews tend to be more negative (${Math.round(sentimentCounts.negative / reviewHistory.length * 100)}% negative sentiment).`}
              </li>
              
              {reviewHistory.length >= 3 && (
                <li>
                  {getFilteredHistory().slice(-3).every(r => r.sentiment === 'positive') 
                    ? 'Your recent reviews show a positive trend.' 
                    : getFilteredHistory().slice(-3).every(r => r.sentiment === 'negative')
                    ? 'Your recent reviews show a negative trend.'
                    : 'Your recent reviews show mixed sentiment.'}
                </li>
              )}
              
              <li>
                {Math.round(reviewHistory.reduce((sum, review) => sum + review.confidence, 0) / reviewHistory.length * 100) > 75
                  ? 'Your sentiment analysis shows high confidence overall.'
                  : 'Consider providing more detailed reviews to improve confidence scores.'}
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}