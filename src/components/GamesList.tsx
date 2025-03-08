import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faHeart, faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons'

interface Game {
  id: string
  title: string
  description: string
  category: string
  image: string
  likes: number
  plays: number
}

interface GamesListProps {
  endpoint?: string
  title?: string
  showSearch?: boolean
  emptyMessage?: string
  limit?: number
}

export default function GamesList({
  endpoint = '/api/games',
  title = 'Games',
  showSearch = true,
  emptyMessage = 'No games found',
  limit
}: GamesListProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    setIsLoading(true);
    
    // Fetch games from API
    fetch(endpoint)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch games');
        return response.json();
      })
      .then(data => {
        const gamesData = Array.isArray(data) ? data : [];
        setGames(limit ? gamesData.slice(0, limit) : gamesData);
        setFilteredGames(limit ? gamesData.slice(0, limit) : gamesData);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching games:', error);
        setError('Failed to load games. Please try again later.');
        setIsLoading(false);
      });
  }, [endpoint, limit]);
  
  // Filter games when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredGames(games);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = games.filter(game => 
      game.title.toLowerCase().includes(term) || 
      game.description.toLowerCase().includes(term) ||
      game.category.toLowerCase().includes(term)
    );
    
    setFilteredGames(filtered);
  }, [searchTerm, games]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <section className="games-list-section">
      <div className="games-list-header">
        <h2>{title}</h2>
        {showSearch && (
          <div className="search-bar">
            <FontAwesomeIcon icon={faSearch} />
            <input 
              type="text" 
              placeholder="Search games..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading games...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="empty-state">
          <h3>{emptyMessage}</h3>
          <Link href="/upload-game" className="create-button">
            Upload Game
          </Link>
        </div>
      ) : (
        <div className="game-grid">
          {filteredGames.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-image">
                <img src={game.image} alt={game.title} />
                <div className="game-category">{game.category}</div>
              </div>
              <div className="game-info" style={{ 
                backgroundImage: `url(${game.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div className="game-info-blur"></div>
                <div className="game-info-content">
                  <Link href={`/game/${game.id}`}>
                    <h3>{game.title}</h3>
                  </Link>
                  <p>{game.description?.length > 100 
                    ? `${game.description.substring(0, 100)}...` 
                    : game.description}</p>
                  <div className="game-meta">
                    <span>
                      <FontAwesomeIcon icon={faHeart} /> {game.likes.toLocaleString()}
                    </span>
                    <span>
                      <FontAwesomeIcon icon={faPlay} /> {game.plays.toLocaleString()} plays
                    </span>
                  </div>
                  <Link href={`/game/${game.id}`} className="play-outline-button">
                    PLAY <FontAwesomeIcon icon={faPlay} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .games-list-section {
          margin-bottom: 2rem;
        }
        
        .games-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        h2 {
          font-size: 1.5rem;
          margin: 0;
        }
        
        .search-bar {
          display: flex;
          align-items: center;
          background-color: var(--card-bg);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          width: 300px;
        }
        
        .search-bar input {
          background: transparent;
          border: none;
          color: var(--text-color);
          margin-left: 0.5rem;
          width: 100%;
          outline: none;
        }
        
        .loading-container, .error-container, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }
        
        .error-container button, .create-button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          text-decoration: none;
        }
        
        .game-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        
        .game-card {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 380px; /* Fixed height for compact cards */
          display: flex;
          flex-direction: column;
        }
        
        .game-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        
        .game-image {
          position: relative;
          height: 140px; /* Smaller image height for compact design */
        }
        
        .game-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .game-category {
          position: absolute;
          top: 0.8rem;
          left: 0.8rem;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        
        .game-info {
          padding: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        .game-info-blur {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          backdrop-filter: blur(20px); /* Extreme blur as requested */
          -webkit-backdrop-filter: blur(20px);
          background-color: rgba(10, 10, 20, 0.7); /* Dark overlay for readability */
          z-index: 1;
        }
        
        .game-info-content {
          position: relative;
          z-index: 2;
          padding: 1.2rem;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .game-info h3 {
          font-size: 1.2rem;
          margin-bottom: 0.6rem;
          color: white;
          line-height: 1.3;
          margin-top: 0;
        }
        
        .game-info p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.85rem;
          line-height: 1.4;
          margin-bottom: 0.8rem;
          flex: 1; /* Allow description to take available space */
          overflow: hidden;
        }
        
        .game-meta {
          display: flex;
          justify-content: space-between;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
          margin-bottom: 0.8rem;
        }
        
        .play-outline-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem 1rem;
          background-color: transparent;
          color: var(--primary-color);
          border: 1px solid var(--primary-color);
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.3s, color 0.3s;
          margin-top: auto; /* Push button to bottom */
          text-align: center;
          letter-spacing: 0.5px;
        }
        
        .play-outline-button:hover {
          background-color: var(--primary-color);
          color: white;
        }
        
        @media (max-width: 768px) {
          .games-list-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .search-bar {
            width: 100%;
          }
          
          .game-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
        }
      `}</style>
    </section>
  );
} 