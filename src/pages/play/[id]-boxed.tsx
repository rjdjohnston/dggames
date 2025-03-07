import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Header from '../../components/Header';
import GamePlayer from '../../components/GamePlayer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faHeart, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

interface Author {
  id: string;
  name: string;
  image: string;
}

interface GameData {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  image: string;
  likes: number;
  plays: number;
  gameType: string;
  files: {
    mainFile: string;
    assetFiles: string[];
  };
  settings: {
    width: number;
    height: number;
    fullscreen: boolean;
  };
  author: Author;
  createdAt: string;
}

export default function PlayGame() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [game, setGame] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch game details
    fetch(`/api/games/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch game');
        return response.json();
      })
      .then(data => {
        setGame(data);
        setIsLoading(false);
        
        // Record a play
        fetch(`/api/games/${id}/play`, { method: 'POST' }).catch(console.error);
      })
      .catch(error => {
        console.error('Error:', error);
        setError('Unable to load game. Please try again later.');
        setIsLoading(false);
      });
  }, [id]);
  
  const handleLike = async () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (!game || hasLiked) return;
    
    try {
      const response = await fetch(`/api/games/${id}/like`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setHasLiked(true);
        setGame(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      }
    } catch (error) {
      console.error('Error liking game:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="container">
        <Header />
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  if (error || !game) {
    return (
      <div className="container">
        <Header />
        <div className="error-container">
          <p>{error || 'Game not found'}</p>
          <button onClick={() => router.push('/my-games')} className="back-button">
            Back to My Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      
      <main className="play-container">
        <div className="game-header">
          <button onClick={() => router.back()} className="back-button">
            <FontAwesomeIcon icon={faChevronLeft} /> Back
          </button>
          
          <h1>{game.title}</h1>
          
          <button 
            onClick={handleLike}
            className={`like-button ${hasLiked ? 'liked' : ''}`}
            disabled={hasLiked}
          >
            <FontAwesomeIcon icon={faHeart} />
            {hasLiked ? 'Liked' : 'Like'} ({game.likes})
          </button>
        </div>
        
        <GamePlayer game={game} />
        
        <div className="game-info">
          <div className="game-description">
            <h2>About This Game</h2>
            <p>{game.description}</p>
          </div>
          
          <div className="game-meta">
            <div className="meta-item">
              <span className="meta-label">Category:</span>
              <span className="meta-value">{game.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Game Type:</span>
              <span className="meta-value">{game.gameType}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Created By:</span>
              <span className="meta-value">
                <Link href={`/profile/${game.author?.id}`}>
                  {game.author?.name || 'Unknown'}
                </Link>
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Plays:</span>
              <span className="meta-value">{game.plays}</span>
            </div>
          </div>
        </div>
      </main>
      
      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: var(--background-dark);
          color: var(--text-color);
        }
        
        .play-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .game-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        h1 {
          font-size: 2rem;
          margin: 0;
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-color);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .back-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .like-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .like-button:hover:not(:disabled) {
          background-color: var(--primary-color);
          color: white;
        }
        
        .like-button.liked {
          background-color: var(--primary-color);
          color: white;
          cursor: default;
        }
        
        .game-info {
          margin-top: 2rem;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          background-color: var(--card-bg);
          border-radius: 8px;
          padding: 1.5rem;
        }
        
        .game-description h2 {
          font-size: 1.5rem;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .game-description p {
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .game-meta {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          padding-left: 1.5rem;
        }
        
        .meta-item {
          display: flex;
          justify-content: space-between;
        }
        
        .meta-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }
        
        .meta-value {
          font-weight: 500;
        }
        
        .meta-value a {
          color: var(--primary-color);
          text-decoration: none;
        }
        
        .meta-value a:hover {
          text-decoration: underline;
        }
        
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
          text-align: center;
          padding: 2rem;
        }
        
        @media (max-width: 768px) {
          .game-info {
            grid-template-columns: 1fr;
          }
          
          .game-meta {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
} 