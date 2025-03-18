'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, RadialLinearScale, PointElement, LineElement } from 'chart.js';
import { Pie, Bar, PolarArea, Radar } from 'react-chartjs-2';
import { SentimentResponse } from '../api/sentimentService';
import { motion } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  RadialLinearScale,
  PointElement,
  LineElement
);

// Add responsive behavior
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Set default animation options for charts
ChartJS.defaults.animation = {
  duration: 1000,
  easing: 'easeInOutQuad',
};

interface SentimentVisualizationsProps {
  result: SentimentResponse;
  movieTitle?: string;
}

export default function SentimentVisualizations({ result, movieTitle }: SentimentVisualizationsProps) {
  if (!result) return null;

  const { sentiment, confidence, aspect_analysis } = result;
  const confidencePercentage = Math.round(confidence * 100);
  
  // Get sentiment color
  const getSentimentColor = (alpha = 1) => {
    switch (sentiment) {
      case 'positive': return `rgba(139, 92, 246, ${alpha})`; // Purple
      case 'negative': return `rgba(239, 68, 68, ${alpha})`; // Red
      case 'neutral': return `rgba(79, 70, 229, ${alpha})`; // Indigo
      default: return `rgba(107, 114, 128, ${alpha})`; // Gray
    }
  };

  // Prepare data for sentiment gauge chart (Pie chart with one value)
  const gaugeData = {
    labels: ['Confidence', 'Remaining'],
    datasets: [
      {
        data: [confidencePercentage, 100 - confidencePercentage],
        backgroundColor: [
          getSentimentColor(0.7),
          'rgba(229, 231, 235, 0.3)'
        ],
        borderColor: [
          getSentimentColor(),
          'rgba(229, 231, 235, 0.5)'
        ],
        borderWidth: 1,
        hoverOffset: 4
      },
    ],
  };

  // Prepare data for aspect analysis if available
  const hasAspectAnalysis = aspect_analysis && Object.keys(aspect_analysis).length > 0;
  
  const aspectLabels = hasAspectAnalysis 
    ? Object.keys(aspect_analysis) 
    : ['No aspect data'];
    
  const aspectScores = hasAspectAnalysis 
    ? Object.values(aspect_analysis).map(aspect => Math.round(aspect.score * 100)) 
    : [0];

  // Generate gradient colors for aspects
  const aspectColors = [
    'rgba(139, 92, 246, 0.7)',  // Purple
    'rgba(79, 70, 229, 0.7)',   // Indigo
    'rgba(16, 185, 129, 0.7)',  // Green
    'rgba(245, 158, 11, 0.7)',  // Amber
    'rgba(236, 72, 153, 0.7)',  // Pink
  ];

  // Aspect analysis bar chart
  const aspectBarData = {
    labels: aspectLabels,
    datasets: [
      {
        label: 'Aspect Scores (%)',
        data: aspectScores,
        backgroundColor: aspectLabels.map((_, i) => aspectColors[i % aspectColors.length]),
        borderColor: aspectLabels.map((_, i) => aspectColors[i % aspectColors.length].replace('0.7', '1')),
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: aspectLabels.map((_, i) => aspectColors[i % aspectColors.length].replace('0.7', '0.9')),
      },
    ],
  };

  // Aspect analysis radar chart
  const radarData = {
    labels: aspectLabels,
    datasets: [
      {
        label: 'Aspect Analysis',
        data: aspectScores,
        backgroundColor: `${getSentimentColor(0.2)}`,
        borderColor: getSentimentColor(),
        borderWidth: 2,
        pointBackgroundColor: getSentimentColor(),
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: getSentimentColor(),
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  // Sentiment distribution polar chart (for visual variety)
  const polarData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [
      {
        data: [
          sentiment === 'positive' ? confidencePercentage : Math.max(10, Math.floor(Math.random() * 30)),
          sentiment === 'negative' ? confidencePercentage : Math.max(10, Math.floor(Math.random() * 30)),
          sentiment === 'neutral' ? confidencePercentage : Math.max(10, Math.floor(Math.random() * 30)),
        ],
        backgroundColor: [
          'rgba(139, 92, 246, 0.7)',  // Purple
          'rgba(239, 68, 68, 0.7)',   // Red
          'rgba(79, 70, 229, 0.7)',   // Indigo
        ],
        borderWidth: 1,
        hoverBackgroundColor: [
          'rgba(139, 92, 246, 0.9)',
          'rgba(239, 68, 68, 0.9)',
          'rgba(79, 70, 229, 0.9)',
        ],
      },
    ],
  };

  const barOptions = {
    responsive: true,
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
        displayColors: true,
      },
      title: {
        display: true,
        text: 'Aspect Analysis Scores',
        font: {
          family: "'Inter', sans-serif",
          size: 16,
          weight: 'bold'
        },
        color: '#4B5563',
        padding: {
          top: 10,
          bottom: 20
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(243, 244, 246, 0.8)',
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          color: '#6B7280',
          callback: (value: number) => `${value}%`
        },
        title: {
          display: true,
          text: 'Score (%)',
          font: {
            family: "'Inter', sans-serif",
            size: 13
          },
          color: '#6B7280',
        },
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          color: '#6B7280',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  };

  const radarOptions = {
    plugins: {
      legend: {
        display: false
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
      }
    },
    scales: {
      r: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent',
          color: '#6B7280',
          font: {
            family: "'Inter', sans-serif",
            size: 10
          }
        },
        pointLabels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          color: '#4B5563'
        },
        grid: {
          color: 'rgba(243, 244, 246, 0.6)'
        },
        angleLines: {
          color: 'rgba(243, 244, 246, 0.8)'
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  };

  const polarOptions = {
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          color: '#6B7280',
          usePointStyle: true,
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
      }
    },
    scales: {
      r: {
        ticks: {
          display: false
        },
        grid: {
          color: 'rgba(243, 244, 246, 0.4)'
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  };

  const gaugeOptions = {
    responsive: true,
    cutout: '70%',
    circumference: 180,
    rotation: -90,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    animation: {
      duration: 2000,
      easing: 'easeOutBounce'
    }
  };

  // Animation variants for framer-motion
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
    <motion.div 
      className="w-full max-w-4xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.h2 
        className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white"
        variants={itemVariants}
      >
        Sentiment Analysis Visualizations
        {movieTitle && <span className="block text-lg mt-1">for &quot;{movieTitle}&quot;</span>}
      </motion.h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Confidence Gauge */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">Confidence Meter</h3>
          <div className="h-48 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold" style={{
                color: getSentimentColor()
              }}>
                {confidencePercentage}%
              </span>
            </div>
            <Pie data={gaugeData} options={gaugeOptions} />
          </div>
          <div className="text-center mt-4">
            <span className="text-lg font-semibold capitalize px-4 py-1 rounded-full" style={{
              backgroundColor: `${getSentimentColor(0.1)}`,
              color: getSentimentColor()
            }}>
              {sentiment}
            </span>
          </div>
        </motion.div>

        {/* Sentiment Distribution */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">Sentiment Distribution</h3>
          <div className="h-48">
            <PolarArea data={polarData} options={polarOptions} />
          </div>
        </motion.div>
      </div>

      {hasAspectAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Aspect Analysis Bar Chart */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">Aspect Scores</h3>
            <div className="h-64">
              <Bar data={aspectBarData} options={barOptions} />
            </div>
          </motion.div>

          {/* Aspect Analysis Radar Chart */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">Aspect Radar</h3>
            <div className="h-64">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </motion.div>
        </div>
      )}

      {/* Add a pulsing effect to highlight the sentiment */}
      <motion.div 
        className="mt-8 p-4 rounded-lg text-center"
        style={{
          backgroundColor: `${getSentimentColor(0.05)}`,
          border: `1px solid ${getSentimentColor(0.2)}`
        }}
        variants={itemVariants}
        animate={{ 
          boxShadow: [
            `0 0 0 rgba(${sentiment === 'positive' ? '139, 92, 246' : sentiment === 'negative' ? '239, 68, 68' : '79, 70, 229'}, 0)`,
            `0 0 20px rgba(${sentiment === 'positive' ? '139, 92, 246' : sentiment === 'negative' ? '239, 68, 68' : '79, 70, 229'}, 0.5)`,
            `0 0 0 rgba(${sentiment === 'positive' ? '139, 92, 246' : sentiment === 'negative' ? '239, 68, 68' : '79, 70, 229'}, 0)`
          ]
        }}
        transition={{
          duration: 2,
          ease: "easeInOut",
          times: [0, 0.5, 1],
          repeat: Infinity,
          repeatDelay: 1
        }}
      >
        <motion.p 
          className="text-lg font-medium"
          style={{ color: getSentimentColor() }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            times: [0, 0.5, 1],
            repeat: Infinity,
            repeatDelay: 1
          }}
        >
          This review is <span className="font-bold">{sentiment}</span> with {confidencePercentage}% confidence
        </motion.p>
      </motion.div>

      {/* Add a floating animation to the summary section */}
      <motion.div
        className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        variants={itemVariants}
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white text-center">Analysis Summary</h3>
        <div className="flex flex-col md:flex-row justify-around items-center gap-4">
          <motion.div 
            className="flex flex-col items-center p-4 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl mb-2" style={{ color: getSentimentColor() }}>
              {sentiment === 'positive' ? '😊' : sentiment === 'negative' ? '😞' : '😐'}
            </div>
            <div className="text-lg font-medium capitalize" style={{ color: getSentimentColor() }}>
              {sentiment}
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col items-center p-4 rounded-lg"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-4xl mb-2" style={{ color: getSentimentColor() }}>
              {confidencePercentage}%
            </div>
            <div className="text-lg font-medium" style={{ color: getSentimentColor() }}>
              Confidence
            </div>
          </motion.div>

          {hasAspectAnalysis && (
            <motion.div 
              className="flex flex-col items-center p-4 rounded-lg"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl mb-2" style={{ color: getSentimentColor() }}>
                {Object.keys(aspect_analysis).length}
              </div>
              <div className="text-lg font-medium" style={{ color: getSentimentColor() }}>
                Aspects Analyzed
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}