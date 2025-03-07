import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Header from '../../components/Header';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faHeart, faSpinner, 
  faCog, faHistory, faInfoCircle, faVolumeUp,
  faExpand, faCompress
} from '@fortawesome/free-solid-svg-icons';
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
  const [showSidebar, setShowSidebar] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameFrameRef = useRef<HTMLIFrameElement>(null);

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

  const toggleFullscreen = () => {
    if (!gameFrameRef.current) return;

    if (!isFullscreen) {
      if (gameFrameRef.current.requestFullscreen) {
        gameFrameRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  if (isLoading) {
    return (
      <div className="play-page">
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }
  
  if (error || !game) {
    return (
      <div className="play-page">
        <div className="error-container">
          <p>{error || 'Game not found'}</p>
          <button onClick={() => router.push('/discover')} className="back-button">
            Back to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-page">
      <div className="game-layout">
        <div className="game-header">
          <button onClick={() => router.back()} className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1>{game.title}</h1>
          <div className="game-controls">
            <button 
              className="control-button"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen"
            >
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
            </button>
            <button 
              className="control-button"
              onClick={() => setShowSidebar(!showSidebar)}
              aria-label="Toggle info panel"
            >
              <FontAwesomeIcon icon={faInfoCircle} />
            </button>
            <button 
              className="control-button" 
              onClick={handleLike}
              aria-label="Like game"
            >
              <FontAwesomeIcon icon={faHeart} className={hasLiked ? "liked" : ""} />
            </button>
          </div>
        </div>
        
        <div className="game-main">
          <div className="game-container">
            {game.files?.mainFile ? (
              <iframe 
                ref={gameFrameRef}
                src={game.files.mainFile}
                className="game-frame"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="game-placeholder">
                <p>This game doesn't have a playable file.</p>
              </div>
            )}
          </div>
        </div>
        
        {showSidebar && (
          <div className="game-sidebar">
            <div className="sidebar-header">
              <h2>Game Info</h2>
              <button onClick={() => setShowSidebar(false)} className="close-button">×</button>
            </div>
            
            <div className="sidebar-content">
              <div className="game-image">
                <img src={game.image} alt={game.title} />
              </div>
              
              <div className="game-details">
                <h3>About</h3>
                <p>{game.description}</p>
                
                <div className="game-stats">
                  <div className="stat-item">
                    <span className="stat-label">Category</span>
                    <span className="stat-value">{game.category}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Creator</span>
                    <span className="stat-value">
                      <Link href={`/profile/${game.author?.id}`}>
                        {game.author?.name || 'Unknown'}
                      </Link>
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Game Type</span>
                    <span className="stat-value">{game.gameType}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Plays</span>
                    <span className="stat-value">{game.plays}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Likes</span>
                    <span className="stat-value">{game.likes}</span>
                  </div>
                </div>
              </div>
              
              <div className="sidebar-buttons">
                <button className="sidebar-button" onClick={() => window.location.reload()}>
                  <FontAwesomeIcon icon={faHistory} /> Restart
                </button>
                <button className="sidebar-button" onClick={toggleFullscreen}>
                  <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} /> {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .play-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #121212;
          color: #fff;
          display: flex;
          flex-direction: column;
          z-index: 100;
        }
        
        .game-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
        }
        
        .game-header {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          background-color: #1f1f1f;
          border-bottom: 1px solid #333;
        }
        
        .back-button {
          background: none;
          border: none;
          color: #aaa;
          font-size: 1.2rem;
          cursor: pointer;
          margin-right: 1rem;
        }
        
        h1 {
          flex: 1;
          font-size: 1.2rem;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .game-controls {
          display: flex;
          gap: 0.75rem;
        }
        
        .control-button {
          background: none;
          border: none;
          color: #aaa;
          font-size: 1.2rem;
          cursor: pointer;
        }
        
        .liked {
          color: #f14668;
        }
        
        .game-main {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
        
        .game-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #000;
        }
        
        .game-frame {
          width: 100%;
          height: 100%;
          border: none;
        }
        
        .game-placeholder {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background-color: #1a1a1a;
          color: #888;
          text-align: center;
          padding: 2rem;
        }
        
        .game-sidebar {
          position: absolute;
          top: 0;
          right: 0;
          width: 320px;
          height: 100%;
          background-color: #1f1f1f;
          border-left: 1px solid #333;
          overflow-y: auto;
          z-index: 10;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #333;
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 1.2rem;
        }
        
        .close-button {
          background: none;
          border: none;
          color: #aaa;
          font-size: 1.5rem;
          cursor: pointer;
        }
        
        .sidebar-content {
          padding: 1rem;
        }
        
        .game-image {
          width: 100%;
          height: 150px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 1rem;
        }
        
        .game-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .game-details h3 {
          margin-top: 0;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }
        
        .game-details p {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          color: #aaa;
          line-height: 1.5;
        }
        
        .game-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: #888;
        }
        
        .stat-value {
          font-size: 0.9rem;
          margin-top: 0.25rem;
        }
        
        .stat-value a {
          color: #7289da;
          text-decoration: none;
        }
        
        .stat-value a:hover {
          text-decoration: underline;
        }
        
        .sidebar-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 2rem;
        }
        
        .sidebar-button {
          width: 100%;
          padding: 0.75rem;
          background-color: #2a2a2a;
          color: white;
          border: none;
          border-radius: 4px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .sidebar-button:hover {
          background-color: #333;
        }
        
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
        }
        
        .error-container button {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background-color: #7289da;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        @media (max-width: 768px) {
          .game-sidebar {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 