import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faPlus, faCompass, faGamepad, faSpinner, faHeart, faSearch, faUser, faLock } from '@fortawesome/free-solid-svg-icons'
import Header from '../components/Header'

interface Game {
  id: string
  title: string
  description: string
  category: string
  image: string
  likes: number
  plays: number
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setIsLoading(true);
    
    // Fetch games from API
    fetch('/api/games')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch games');
        return response.json();
      })
      .then(data => {
        setGames(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching games:', error);
        setError('Failed to load games. Please try again later.');
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto">
      <Header />

      <main className="main-content">
        <div className="parallax-background"></div>
        <section className="hero-section">
          <div className="hero-content">
            <h1>Create Your Adventure</h1>
            <p className="hero-description">
              Embark on endless adventures with our AI-powered gaming platform.
              Your choices shape unique narratives in any genre you can imagine.
            </p>
            <div className="cta-buttons">
              <Link href="/upload-game" className="cta-button primary">
                <FontAwesomeIcon icon={faPlus} className="button-icon" />
                New Game
              </Link>
              <Link href="/discover" className="cta-button secondary">
                <FontAwesomeIcon icon={faCompass} className="button-icon" />
                Discover Games
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://picsum.photos/600/400" alt="Adventure illustration" />
          </div>
        </section>

        <section className="featured-section">
          <h2>Featured Games</h2>
          
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
          ) : games.length === 0 ? (
            <div className="empty-state">
              <h3>No games found</h3>
              <p>Be the first to create a new game!</p>
              <Link href="/create" className="create-button">
                Create Game
              </Link>
            </div>
          ) : (
          <div className="game-grid">
          {games.map((game) => (
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
        </section>

        <section className="info-section">
          <div className="info-card">
            <h2>Infinite Possibilities</h2>
            <p>
              Our advanced AI creates responsive, dynamic stories that adapt to your choices.
              Every decision you make shapes a unique narrative experience.
            </p>
          </div>
          <div className="info-card">
            <h2>Any Genre, Any Setting</h2>
            <p>
              Fantasy, sci-fi, mystery, romance - explore any world you can imagine.
              The only limit is your creativity.
            </p>
          </div>
        </section>
      </main>

      <style jsx>{`
        .main-content {
          padding-top: 60px; /* Same as header height to prevent content from being hidden */
          position: relative;
        }
        
        .parallax-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background-image: url('https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-1.2.1&auto=format&fit=crop&w=2100&q=80');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: -1;
          opacity: 0.4;
        }
        
        main {
          position: relative;
          z-index: 1;
        }
        
        .hero-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4rem 2rem;
          min-height: 60vh;
          position: relative;
          overflow: hidden;
          background-color: rgba(10, 10, 20, 0.7);
          backdrop-filter: blur(3px);
          border-radius: 8px;
          margin: 2rem 1rem;
        }
        
        .hero-content {
          flex: 1;
          max-width: 600px;
          z-index: 2;
        }
        
        h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          background: linear-gradient(45deg, var(--primary-color), #9c88ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.1;
        }
        
        .hero-description {
          font-size: 1.2rem;
          line-height: 1.6;
          margin-bottom: 2rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .cta-buttons {
          display: flex;
          gap: 1rem;
        }
        
        .cta-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          border-radius: 4px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .primary {
          background-color: var(--primary-color);
          color: white;
        }
        
        .primary:hover {
          background-color: #7f6df2;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124, 104, 242, 0.4);
        }
        
        .secondary {
          background-color: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .secondary:hover {
          background-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }
        
        .button-icon {
          font-size: 0.9rem;
        }
        
        .hero-image {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1;
        }
        
        .hero-image img {
          max-width: 100%;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .featured-section {
          padding: 0;
          border-radius: 8px;
          margin: 2rem 1rem;
        }
        
        h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-align: center;
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
        
        .loading-container, .error-container, .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }
        
        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding: 2rem;
          margin: 2rem 1rem;
        }
        
        .info-card {
          background-color: var(--card-bg);
          padding: 2rem;
          border-radius: 8px;
          text-align: center;
        }
        
        .info-card h2 {
          margin-bottom: 1rem;
        }
        
        .info-card p {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .hero-section {
            flex-direction: column;
          }

          .hero-image {
            order: -1;
          }

          h1 {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 600px) {
          .cta-buttons {
            flex-direction: column;
          }

          .info-section {
            grid-template-columns: 1fr;
          }
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
          margin-top: 0.8rem;
          text-align: center;
          letter-spacing: 0.5px;
        }
        
        .play-outline-button:hover {
          background-color: var(--primary-color);
          color: white;
        }
      `}</style>
    </div>
  )
} 