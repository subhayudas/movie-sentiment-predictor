'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa';
import ReviewForm from './components/ReviewForm';
import SentimentResult from './components/SentimentResult';
import SentimentChart from './components/SentimentChart';
import Hero from './components/Hero';
import { analyzeSentiment, ReviewSubmission, SentimentResponse, ReviewWithResults } from './api/sentimentService';
import './performance.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SentimentResponse | null>(null);
  const [currentMovieTitle, setCurrentMovieTitle] = useState<string>('');
  const [reviewHistory, setReviewHistory] = useState<ReviewWithResults[]>([]);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Debounced scroll handler to improve performance
  const handleScroll = useCallback(() => {
    // Use requestAnimationFrame to limit updates to frame rate
    requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > 10);
      
      // Update active section based on scroll position
      const sections = ['hero', 'analyze', 'history', 'about'];
      const currentSection = sections.find(section => {
        const element = document.getElementById(section);
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });
      
      if (currentSection && currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    });
  }, [activeSection]);
  
  useEffect(() => {
    // Use passive: true to improve scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  // Load review history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('reviewHistory');
    if (savedHistory) {
      try {
        // Parse the saved history and convert string dates back to Date objects
        const parsedHistory = JSON.parse(savedHistory).map((item: ReviewWithResults) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setReviewHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading review history:', error);
      }
    }
  }, []);

  // Save review history to localStorage whenever it changes
  useEffect(() => {
    if (reviewHistory.length > 0) {
      localStorage.setItem('reviewHistory', JSON.stringify(reviewHistory));
    }
  }, [reviewHistory]);

  const handleSubmitReview = async (data: ReviewSubmission) => {
    setIsLoading(true);
    setResult(null);
    setCurrentMovieTitle(data.movieTitle || '');
    
    try {
      // Call the sentiment analysis API
      const sentimentResult = await analyzeSentiment(data);
      setResult(sentimentResult);
      
      // Add the result to history
      const reviewWithResult: ReviewWithResults = {
        ...data,
        sentiment: sentimentResult.sentiment,
        confidence: sentimentResult.confidence,
        timestamp: new Date(),
        id: uuidv4()
      };
      
      setReviewHistory(prev => [reviewWithResult, ...prev]);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground hardware-accelerated">
      {/* New Redesigned Navbar with Updated Colors */}
      <nav 
        className="fixed top-0 w-full z-50 transition-all duration-300 py-2"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="
            rounded-full 
            bg-gradient-to-r from-indigo-900 to-purple-800
            backdrop-blur-xl shadow-lg border border-indigo-500/30
            transition-all duration-300
          ">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-purple-100">
                  MovieSense
                </span>
              </div>
              
              <div className="hidden md:flex md:items-center md:space-x-6">
                {['hero', 'analyze', 'history', 'about'].map((section) => (
                  <a
                    key={section}
                    href={`#${section}`}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeSection === section
                        ? 'bg-indigo-700 text-white shadow-sm'
                        : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </a>
                ))}
              </div>
              
              <div className="md:hidden">
                <button
                  onClick={() => setIsNavOpen(!isNavOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-indigo-800 focus:outline-none"
                  aria-expanded={isNavOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  {isNavOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu with updated colors */}
          {isNavOpen && (
            <div className="md:hidden mt-2 animate-fadeIn">
              <div className="bg-gradient-to-r from-indigo-900 to-purple-800 backdrop-blur-xl rounded-xl shadow-lg border border-indigo-500/30 overflow-hidden">
                {['hero', 'analyze', 'history', 'about'].map((section) => (
                  <a
                    key={section}
                    href={`#${section}`}
                    className={`block px-4 py-3 text-base font-medium transition-all duration-200 ${
                      activeSection === section
                        ? 'bg-indigo-700 text-white'
                        : 'text-indigo-100 hover:bg-indigo-800 hover:text-white'
                    }`}
                    onClick={() => setIsNavOpen(false)}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen">
        <Hero />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        <section id="analyze" className="pt-24 scroll-mt-16 lazy-section">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl fade-in-up">
            <h2 className="text-3xl font-bold mb-6 animate-gradient-text">Analyze Review</h2>
            <ReviewForm onSubmit={handleSubmitReview} isLoading={isLoading} />
          </div>
        </section>

        {result && (
          <section className="fade-in-up">
            <SentimentResult result={result} movieTitle={currentMovieTitle} />
          </section>
        )}

        <section id="history" className="pt-24 scroll-mt-16">
          <h2 className="text-3xl font-bold mb-6 animate-gradient-text">Analysis History</h2>
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl">
            <SentimentChart reviewHistory={reviewHistory} />
          </div>
        </section>

        <section id="about" className="pt-24 pb-24 scroll-mt-16">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-xl fade-in-up">
            <h2 className="text-3xl font-bold mb-6 animate-gradient-text">About</h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lg text-white/80">
                Our advanced AI-powered sentiment analysis tool helps you understand the emotional tone of movie reviews.
                Using state-of-the-art natural language processing, we analyze reviews to determine their sentiment,
                extract key phrases, and provide detailed aspect-based analysis.
              </p>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 shadow-lg">
                  <div className="text-primary text-4xl mb-4 bounce">🎭</div>
                  <h3 className="text-xl font-semibold mb-2">Sentiment Detection</h3>
                  <p className="text-white/70">Accurately identifies the emotional tone of reviews</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 shadow-lg animation-delay-2000">
                  <div className="text-primary text-4xl mb-4 bounce animation-delay-2000">🎯</div>
                  <h3 className="text-xl font-semibold mb-2">Aspect Analysis</h3>
                  <p className="text-white/70">Breaks down reviews by specific movie aspects</p>
                </div>
                <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1 shadow-lg animation-delay-4000">
                  <div className="text-primary text-4xl mb-4 bounce animation-delay-4000">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Visual Insights</h3>
                  <p className="text-white/70">Beautiful visualizations of analysis results</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white/5 backdrop-blur-lg border-t border-white/10 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="mb-4">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600">MovieSense</span>
              </div>
              <p className="text-white/70 max-w-md">
                Empowering movie enthusiasts with AI-powered sentiment analysis for better understanding of film reviews.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2">
                {['hero', 'analyze', 'history', 'about'].map((section) => (
                  <li key={section}>
                    <a 
                      href={`#${section}`} 
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-purple-900/20 text-center">
            <p className="text-foreground/70">© {new Date().getFullYear()} Movie Sentiment Analysis. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

{/* Testimonials */}
              <div className="mt-16">
                <h3 className="text-2xl font-bold mb-8 text-center">What Users Say</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-start mb-4">
                      <FaQuoteLeft className="text-purple-400 text-xl mr-2" />
                    </div>
                    <p className="text-white/80 mb-4">
                      This tool has completely transformed how I understand audience reactions to my indie films. The aspect analysis is incredibly insightful.
                    </p>
                    <div className="flex justify-end">
                      <FaQuoteRight className="text-purple-400 text-xl ml-2" />
                    </div>
                    <div className="mt-4 flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">JD</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">James Director</p>
                        <p className="text-sm text-white/60">Independent Filmmaker</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-start mb-4">
                      <FaQuoteLeft className="text-purple-400 text-xl mr-2" />
                    </div>
                    <p className="text-white/80 mb-4">
                      As a film critic, I use this platform to check my own biases. The sentiment analysis is surprisingly accurate and helps me write more balanced reviews.
                    </p>
                    <div className="flex justify-end">
                      <FaQuoteRight className="text-purple-400 text-xl ml-2" />
                    </div>
                    <div className="mt-4 flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mr-3">
                        <span className="text-white font-bold">SC</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">Sarah Critic</p>
                        <p className="text-sm text-white/60">Film Reviewer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
