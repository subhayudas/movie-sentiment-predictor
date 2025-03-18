'use client';

import { useState } from 'react';
import { FaFilm, FaSearch, FaStar, FaRegStar, FaStarHalfAlt, FaFilter, FaHeart, FaRegHeart, FaBookmark, FaInfoCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Movie {
  id: string;
  title: string;
  year: string;
  genre: string;
  rating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  posterUrl: string;
  director?: string;
  description?: string;
}

// Mock data - in a real app, this would come from an API
const mockMovies: Movie[] = [
  {
    id: '1',
    title: 'The Shawshank Redemption',
    year: '1994',
    genre: 'Drama',
    rating: 9.3,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg',
    director: 'Frank Darabont',
    description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.'
  },
  {
    id: '2',
    title: 'The Godfather',
    year: '1972',
    genre: 'Crime, Drama',
    rating: 9.2,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
    director: 'Francis Ford Coppola',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.'
  },
  {
    id: '3',
    title: 'The Dark Knight',
    year: '2008',
    genre: 'Action, Crime, Drama',
    rating: 9.0,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg',
    director: 'Christopher Nolan',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.'
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    year: '1994',
    genre: 'Crime, Drama',
    rating: 8.9,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
    director: 'Quentin Tarantino',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.'
  },
  {
    id: '5',
    title: 'Fight Club',
    year: '1999',
    genre: 'Drama',
    rating: 8.8,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg',
    director: 'David Fincher',
    description: 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.'
  },
  {
    id: '6',
    title: 'Inception',
    year: '2010',
    genre: 'Action, Adventure, Sci-Fi',
    rating: 8.8,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg',
    director: 'Christopher Nolan',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.'
  },
  {
    id: '7',
    title: 'The Matrix',
    year: '1999',
    genre: 'Action, Sci-Fi',
    rating: 8.7,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg',
    director: 'Lana Wachowski, Lilly Wachowski',
    description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.'
  },
  {
    id: '8',
    title: 'Parasite',
    year: '2019',
    genre: 'Drama, Thriller',
    rating: 8.5,
    sentiment: 'positive',
    posterUrl: 'https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg',
    director: 'Bong Joon Ho',
    description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.'
  }
];

export default function MovieRecommendations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const moviesPerPage = 4;

  const genres = Array.from(new Set(mockMovies.map(movie => movie.genre.split(', ')).flat()));
  
  // Sort and filter movies
  const sortedAndFilteredMovies = mockMovies
    .filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (movie.director && movie.director.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGenre = selectedGenre === '' || movie.genre.includes(selectedGenre);
      const matchesSentiment = selectedSentiment === '' || movie.sentiment === selectedSentiment;
      
      return matchesSearch && matchesGenre && matchesSentiment;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return sortOrder === 'desc' ? b.rating - a.rating : a.rating - b.rating;
      } else if (sortBy === 'year') {
        return sortOrder === 'desc' 
          ? parseInt(b.year) - parseInt(a.year) 
          : parseInt(a.year) - parseInt(b.year);
      } else {
        // Sort by title
        return sortOrder === 'desc'
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title);
      }
    });

  // Pagination
  const indexOfLastMovie = currentPage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = sortedAndFilteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalPages = Math.ceil(sortedAndFilteredMovies.length / moviesPerPage);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 0.5;
    
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

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg shadow-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FaFilm className="mr-2" />
            Movie Recommendations
          </h2>
          <p className="text-indigo-200 mt-1">
            Discover films based on sentiment analysis of audience reviews
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-md flex items-center text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-indigo-600 text-white' 
                : 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800'
            }`}
          >
            <FaFilter className="mr-1.5" />
            Filters
          </button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
        <div className="bg-indigo-900/40 rounded-lg p-4 border border-indigo-500/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-indigo-300 mb-1 font-medium">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-indigo-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or director..."
                  className="w-full pl-10 pr-4 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-indigo-400"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-indigo-300 mb-1 font-medium">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-indigo-300 mb-1 font-medium">Sentiment</label>
              <select
                value={selectedSentiment}
                onChange={(e) => setSelectedSentiment(e.target.value)}
                className="w-full px-3 py-2 bg-indigo-900/50 border border-indigo-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
              >
                <option value="">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center">
              <span className="text-xs text-indigo-300 mr-2">Sort by:</span>
              <button 
                onClick={() => toggleSort('rating')}
                className={`px-2 py-1 text-xs rounded flex items-center ${sortBy === 'rating' ? 'bg-indigo-600 text-white' : 'bg-indigo-900/30 text-indigo-300'}`}
              >
                Rating {sortBy === 'rating' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button 
                onClick={() => toggleSort('year')}
                className={`px-2 py-1 text-xs rounded flex items-center ml-1 ${sortBy === 'year' ? 'bg-indigo-600 text-white' : 'bg-indigo-900/30 text-indigo-300'}`}
              >
                Year {sortBy === 'year' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button 
                onClick={() => toggleSort('title')}
                className={`px-2 py-1 text-xs rounded flex items-center ml-1 ${sortBy === 'title' ? 'bg-indigo-600 text-white' : 'bg-indigo-900/30 text-indigo-300'}`}
              >
                Title {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Movie Carousel */}
      <div className="relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">
            {selectedGenre ? `${selectedGenre} Movies` : 'Recommended Movies'}
            {selectedSentiment && ` with ${selectedSentiment} reviews`}
          </h3>
          
          <div className="flex space-x-2">
            <button 
              onClick={handlePrevPage} 
              disabled={currentPage === 1}
              className="p-2 rounded-full bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft />
            </button>
            <span className="flex items-center text-indigo-300 text-sm">
              {currentPage} / {totalPages}
            </span>
            <button 
              onClick={handleNextPage} 
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-full bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        
        {sortedAndFilteredMovies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {currentMovies.map(movie => (
              <motion.div 
                key={movie.id} 
                className="bg-indigo-900/40 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-500/20 hover:border-indigo-500/60 h-full flex flex-col"
                whileHover={{ y: -5 }}
                // Removed onMouseEnter and onMouseLeave handlers that used hoveredMovie
              >
                <div className="h-64 overflow-hidden relative group">
                  <Image 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => toggleFavorite(movie.id)}
                        className="p-2 rounded-full bg-black/50 hover:bg-red-600/80 transition-colors"
                      >
                        {favorites.includes(movie.id) ? (
                          <FaHeart className="text-red-500" />
                        ) : (
                          <FaRegHeart className="text-white" />
                        )}
                      </button>
                      
                      <button 
                        onClick={() => toggleWatchlist(movie.id)}
                        className="p-2 rounded-full bg-black/50 hover:bg-indigo-600/80 transition-colors"
                      >
                        {watchlist.includes(movie.id) ? (
                          <FaBookmark className="text-indigo-400" />
                        ) : (
                          <FaBookmark className="text-white" />
                        )}
                      </button>
                      
                      <button 
                        onClick={() => setSelectedMovie(movie)}
                        className="p-2 rounded-full bg-black/50 hover:bg-purple-600/80 transition-colors"
                      >
                        <FaInfoCircle className="text-white" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{movie.title}</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-indigo-300 text-sm">{movie.year}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-800/70 text-indigo-200">{movie.genre.split(',')[0]}</span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    {renderStars(movie.rating)}
                    <span className="ml-2 text-indigo-300">{movie.rating.toFixed(1)}</span>
                  </div>
                  
                  {movie.director && (
                    <p className="text-xs text-indigo-300 mb-2">
                      <span className="font-medium">Director:</span> {movie.director}
                    </p>
                  )}
                  
                  {movie.description && (
                    <p className="text-xs text-indigo-300 line-clamp-2 mb-2">
                      {movie.description}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      movie.sentiment === 'positive' ? 'bg-green-900/50 text-green-300' :
                      movie.sentiment === 'negative' ? 'bg-red-900/50 text-red-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>
                      {movie.sentiment.charAt(0).toUpperCase() + movie.sentiment.slice(1)} Reviews
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-indigo-900/30 rounded-lg p-12 text-center">
            <FaSearch className="mx-auto text-4xl text-indigo-400 mb-4" />
            <p className="text-indigo-300 text-lg mb-2">No movies found matching your criteria</p>
            <p className="text-indigo-400 text-sm">Try adjusting your filters or search term</p>
          </div>
        )}
      </div>
      
      {/* Movie Detail Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div 
              className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 relative h-80 md:h-auto">
                  <Image 
                    src={selectedMovie.posterUrl} 
                    alt={selectedMovie.title} 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="md:w-2/3 p-6 overflow-y-auto max-h-[70vh]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedMovie.title}</h2>
                      <p className="text-indigo-300">{selectedMovie.year} • {selectedMovie.genre}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedMovie(null)}
                      className="text-indigo-300 hover:text-white p-1"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    {renderStars(selectedMovie.rating)}
                    <span className="ml-2 text-white font-bold">{selectedMovie.rating.toFixed(1)}</span>
                    <span className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                      selectedMovie.sentiment === 'positive' ? 'bg-green-900/50 text-green-300' :
                      selectedMovie.sentiment === 'negative' ? 'bg-red-900/50 text-red-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>
                      {selectedMovie.sentiment.charAt(0).toUpperCase() + selectedMovie.sentiment.slice(1)} Reviews
                    </span>
                  </div>
                  
                  {selectedMovie.director && (
                    <p className="text-indigo-200 mb-4">
                      <span className="font-medium">Director:</span> {selectedMovie.director}
                    </p>
                  )}
                  
                  {selectedMovie.description && (
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-2">Synopsis</h3>
                      <p className="text-indigo-200">{selectedMovie.description}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 mt-6">
                    <button 
                      onClick={() => toggleFavorite(selectedMovie.id)}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        favorites.includes(selectedMovie.id) 
                          ? 'bg-red-600 text-white' 
                          : 'bg-indigo-900/70 text-indigo-300 hover:bg-indigo-800'
                      }`}
                    >
                      {favorites.includes(selectedMovie.id) ? (
                        <>
                          <FaHeart className="mr-2" />
                          Favorited
                        </>
                      ) : (
                        <>
                          <FaRegHeart className="mr-2" />
                          Add to Favorites
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => toggleWatchlist(selectedMovie.id)}
                      className={`px-4 py-2 rounded-md flex items-center ${
                        watchlist.includes(selectedMovie.id) 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-indigo-900/70 text-indigo-300 hover:bg-indigo-800'
                      }`}
                    >
                      <FaBookmark className="mr-2" />
                      {watchlist.includes(selectedMovie.id) ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stats Section */}
      <div className="mt-8 pt-6 border-t border-indigo-500/30">
        <h3 className="text-lg font-medium text-white mb-4">Movie Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30">
            <h4 className="text-indigo-300 font-medium mb-2">Sentiment Distribution</h4>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span className="text-green-300 text-sm">Positive: {mockMovies.filter(m => m.sentiment === 'positive').length}</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-blue-300 text-sm">Neutral: {mockMovies.filter(m => m.sentiment === 'neutral').length}</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span className="text-red-300 text-sm">Negative: {mockMovies.filter(m => m.sentiment === 'negative').length}</span>
            </div>
          </div>
          
          <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30">
            <h4 className="text-indigo-300 font-medium mb-2">Top Genres</h4>
            <div className="space-y-2">
              {genres.slice(0, 3).map(genre => (
                <div key={genre} className="flex items-center justify-between">
                  <span className="text-indigo-200 text-sm">{genre}</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-800/70 text-indigo-200">
                    {mockMovies.filter(m => m.genre.includes(genre)).length} movies
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-indigo-900/30 rounded-lg p-4 border border-indigo-500/30">
            <h4 className="text-indigo-300 font-medium mb-2">Your Activity</h4>
            <div className="flex items-center mb-2">
              <FaHeart className="text-red-400 mr-2" />
              <span className="text-indigo-200 text-sm">{favorites.length} movies in favorites</span>
            </div>
            <div className="flex items-center">
              <FaBookmark className="text-indigo-400 mr-2" />
              <span className="text-indigo-200 text-sm">{watchlist.length} movies in watchlist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}