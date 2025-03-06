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

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <h1>Create Your Adventure</h1>
            <p className="hero-description">
              Embark on endless adventures with our AI-powered gaming platform.
              Your choices shape unique narratives in any genre you can imagine.
            </p>
            <div className="cta-buttons">
              <Link href="/create" className="cta-button primary">
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
                  <div className="game-info">
                    <Link href={`/game/${game.id}`}>
                      <h3>{game.title}</h3>
                    </Link>
                    <p>{game.description}</p>
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