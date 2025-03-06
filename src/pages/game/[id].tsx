import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlay, faHeart, faEye, faClock, 
  faTag, faUser, faCalendar, faChevronLeft, faSpinner
} from '@fortawesome/free-solid-svg-icons'
import Header from '../../components/Header'

interface Author {
  id: string
  name: string
  image: string
}

interface GameDetails {
  id: string
  title: string
  description: string
  content: string
  category: string
  image: string
  likes: number
  plays: number
  progress: number
  createdAt: string
  lastUpdated: string
  author: Author
}

export default function GameDetail() {
  const router = useRouter()
  const { id } = router.query
  const { data: session } = useSession()
  const [game, setGame] = useState<GameDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    fetch(`/api/games/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch game details')
        return response.json()
      })
      .then(data => {
        setGame(data)
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setError('Could not load game details. Please try again later.')
        setIsLoading(false)
      })
  }, [id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading game details...</p>
      </div>
    )
  }

  if (error || !game) {
    return (
      <div className="error-container">
        <p>{error || 'Game not found'}</p>
        <button onClick={() => router.push('/discover')}>
          Back to Discover
        </button>
      </div>
    )
  }

  return (
    <div className="game-detail-container">
      <Header />
      
      <div className="game-detail-content">
        <div className="back-button-container">
          <button 
            onClick={() => router.back()} 
            className="back-button"
          >
            <FontAwesomeIcon icon={faChevronLeft} /> Back
          </button>
        </div>
        
        <div className="game-header">
          <div className="game-header-left">
            <h1>{game.title}</h1>
            <div className="game-meta">
              <div className="game-author">
                <div className="author-avatar">
                  {game.author?.image ? (
                    <img src={game.author.image} alt={game.author.name} />
                  ) : (
                    <FontAwesomeIcon icon={faUser} />
                  )}
                </div>
                <span>by {game.author?.name || 'Unknown Author'}</span>
              </div>
              
              <div className="game-category">
                <FontAwesomeIcon icon={faTag} />
                <span>{game.category}</span>
              </div>
              
              <div className="game-date">
                <FontAwesomeIcon icon={faCalendar} />
                <span>Created {formatDate(game.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="game-header-right">
            <div className="game-stats">
              <div className="stat-item">
                <FontAwesomeIcon icon={faHeart} />
                <span>{game.likes.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <FontAwesomeIcon icon={faEye} />
                <span>{game.plays.toLocaleString()}</span>
              </div>
              <div className="stat-item">
                <FontAwesomeIcon icon={faClock} />
                <span>~15 min</span>
              </div>
            </div>
            
            <Link href={`/play/${game.id}`} className="play-button">
              <FontAwesomeIcon icon={faPlay} /> Play Now
            </Link>
          </div>
        </div>
        
        <div className="game-image-container">
          <img src={game.image} alt={game.title} className="game-cover-image" />
        </div>
        
        <div className="game-details">
          <div className="game-description">
            <h2>Description</h2>
            <p>{game.description}</p>
            
            {game.content && (
              <div className="game-content">
                <h3>Game Preview</h3>
                <p>{game.content.substring(0, 400)}...</p>
              </div>
            )}
          </div>
          
          <div className="game-sidebar">
            <div className="sidebar-section">
              <h3>About This Game</h3>
              <div className="sidebar-info">
                <div className="info-item">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{game.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Created:</span>
                  <span className="info-value">{formatDate(game.createdAt)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Updated:</span>
                  <span className="info-value">{formatDate(game.lastUpdated)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Plays:</span>
                  <span className="info-value">{game.plays.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {session && (
              <div className="action-buttons">
                {/* Only show edit button if user is the author */}
                {session.user.id === game.author?.id && (
                  <Link href={`/edit/${game.id}`} className="edit-button">
                    Edit Game
                  </Link>
                )}
                <button className="like-button">
                  <FontAwesomeIcon icon={faHeart} /> Like
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .game-detail-container {
          background-color: var(--background-dark);
          min-height: 100vh;
          color: var(--text-color);
        }
        
        .game-detail-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .back-button-container {
          margin-bottom: 1.5rem;
        }
        
        .back-button {
          background: none;
          border: none;
          color: var(--text-color);
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        
        .back-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 2rem;
        }
        
        .game-header-left {
          flex: 1;
          min-width: 300px;
        }
        
        h1 {
          font-size: 2.5rem;
          margin: 0 0 1rem 0;
          line-height: 1.2;
        }
        
        .game-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .game-author, .game-category, .game-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .author-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background-color: var(--card-bg);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        
        .author-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .game-header-right {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-end;
        }
        
        .game-stats {
          display: flex;
          gap: 1.5rem;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
        }
        
        .play-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 0.8rem 2rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          cursor: pointer;
          transition: background-color 0.3s;
          text-decoration: none;
        }
        
        .play-button:hover {
          background-color: var(--hover-color);
        }
        
        .game-image-container {
          margin-bottom: 2rem;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        .game-cover-image {
          width: 100%;
          height: auto;
          max-height: 500px;
          object-fit: cover;
          display: block;
        }
        
        .game-details {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 3rem;
        }
        
        .game-description h2 {
          font-size: 1.8rem;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .game-description p {
          font-size: 1.05rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        
        .game-content {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .game-content h3 {
          font-size: 1.3rem;
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .game-sidebar {
          background-color: var(--card-bg);
          border-radius: 12px;
          padding: 1.5rem;
        }
        
        .sidebar-section {
          margin-bottom: 2rem;
        }
        
        .sidebar-section h3 {
          font-size: 1.2rem;
          margin-top: 0;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-info {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
        }
        
        .info-label {
          color: var(--text-secondary);
        }
        
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .edit-button, .like-button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
          border: none;
          padding: 0.8rem;
          font-size: 1rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: background-color 0.3s;
          text-decoration: none;
        }
        
        .edit-button:hover, .like-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .like-button {
          color: var(--primary-color);
        }
        
        .loading-container, .error-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 2rem;
        }
        
        .error-container button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .error-container button:hover {
          background-color: var(--hover-color);
        }
        
        @media (max-width: 900px) {
          .game-details {
            grid-template-columns: 1fr;
          }
          
          .game-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .game-header-right {
            align-items: flex-start;
          }
          
          h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  )
} 