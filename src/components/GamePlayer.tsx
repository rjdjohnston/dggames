import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faCompress, faRedo } from '@fortawesome/free-solid-svg-icons';

interface GamePlayerProps {
  game: {
    id: string;
    title: string;
    gameType: string;
    files?: {
      mainFile: string;
    };
    content?: string;
    settings?: {
      width?: number;
      height?: number;
    };
  };
}

const GamePlayer: React.FC<GamePlayerProps> = ({ game }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Record a play when the game is loaded
    const recordPlay = async () => {
      try {
        await fetch(`/api/games/${game.id}/play`, { method: 'POST' });
      } catch (error) {
        console.error('Failed to record play:', error);
      }
    };
    
    if (!isLoading) {
      recordPlay();
    }
  }, [isLoading, game.id]);
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  const resetGame = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };
  
  const getGameUrl = () => {
    return `/api/games/${game.id}/play`;
  };
  
  return (
    <div className="game-player">
      <div className="game-viewport" ref={gameContainerRef}>
        <div className="game-controls">
          <button onClick={resetGame} title="Restart Game" className="control-button">
            <FontAwesomeIcon icon={faRedo} />
          </button>
          <button onClick={toggleFullscreen} title="Toggle Fullscreen" className="control-button">
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
          </button>
        </div>
        
        {game.gameType === 'text' ? (
          <div className="text-adventure">
            <div className="text-content" dangerouslySetInnerHTML={{ __html: game.content || '' }} />
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={getGameUrl()}
            width={game.settings?.width || 800}
            height={game.settings?.height || 600}
            allowFullScreen
            frameBorder="0"
            onLoad={() => setIsLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="game-iframe"
          ></iframe>
        )}
        
        {isLoading && (
          <div className="game-loading">
            <div className="loading-spinner"></div>
            <p>Loading game...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .game-player {
          width: 100%;
          margin-bottom: 2rem;
        }
        
        .game-viewport {
          position: relative;
          background-color: #000;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .game-controls {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
          z-index: 10;
          opacity: 0.5;
          transition: opacity 0.3s ease;
        }
        
        .game-viewport:hover .game-controls {
          opacity: 1;
        }
        
        .control-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease;
        }
        
        .control-button:hover {
          background-color: var(--primary-color);
        }
        
        .game-iframe {
          display: block;
          width: 100%;
          max-width: 100%;
        }
        
        .text-adventure {
          padding: 2rem;
          min-height: 400px;
          background-color: #1a1a1a;
          color: var(--text-color);
          overflow-y: auto;
        }
        
        .text-content {
          font-size: 1.1rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
        
        .game-loading {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
        }
        
        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 4px solid var(--primary-color);
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .game-iframe {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
};

export default GamePlayer; 