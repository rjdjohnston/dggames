import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlay, faHeart, faEye, faClock, 
  faTag, faUser, faCalendar, faChevronLeft, faSpinner, faEdit
} from '@fortawesome/free-solid-svg-icons'
import Header from '../../components/Header'

interface Author {
  id?: string
  name?: string
  image?: string
  email?: string
  username?: string
  displayName?: string
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
  const [authorData, setAuthorData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasLiked, setHasLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    if (!id) return

    fetch(`/api/games/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch game details')
        return response.json()
      })
      .then(data => {
        console.log('Game data received:', data)
        setGame(data)
        
        // Check what author data looks like
        console.log('Author data in game:', data.author)
        
        // If author is just an ID string or object with ID, fetch author details
        const authorId = typeof data.author === 'string' 
          ? data.author 
          : data.author?.id || data.author?._id;
          
        if (authorId) {
          console.log('Fetching author details for ID:', authorId)
          // Fetch author details from an API endpoint
          fetch(`/api/users/${authorId}`)
            .then(res => res.json())
            .then(authorData => {
              console.log('Author details fetched:', authorData)
              setAuthorData(authorData)
            })
            .catch(err => {
              console.error('Error fetching author details:', err)
            })
        }
        
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setError('Could not load game details. Please try again later.')
        setIsLoading(false)
      })
  }, [id])

  // Check if user has already liked the game
  useEffect(() => {
    if (!session || !game || !id) return;
    
    fetch(`/api/games/${id}/like/check`, {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (data.hasLiked) {
          setHasLiked(true);
        }
      })
      .catch(error => {
        console.error('Error checking like status:', error);
      });
  }, [session, game, id]);

  // Determine if current user is the author
  const isCurrentUserAuthor = () => {
    if (!session || !session.user) return false
    
    // Log available data for debugging
    console.log('Checking authorship:')
    console.log('- Session user:', session.user)
    console.log('- Game author:', game?.author)
    console.log('- Fetched author data:', authorData)
    
    // Get current user identifiers for comparison
    const currentUserEmail = session.user.email
    // @ts-ignore - TypeScript doesn't know about id on session.user
    const currentUserId = session.user.id
    
    // Case 1: Author is just an ID string
    if (typeof game?.author === 'string') {
      console.log('Author is string ID:', game.author)
      return (
        // @ts-ignore - TypeScript doesn't know about id
        (currentUserId && currentUserId === game.author) ||
        (authorData?.email && currentUserEmail === authorData.email)
      )
    }
    
    // Case 2: Author is an object with ID
    if (game?.author) {
      // Try various possible ID fields
      const authorId = game.author.id || 
                      // @ts-ignore - TypeScript doesn't know about _id
                      game.author._id || 
                      undefined
                      
      console.log('Author object ID:', authorId)
      
      if (authorId) {
        // Check if current user ID matches author ID
        // @ts-ignore - TypeScript doesn't know about id
        const idMatch = currentUserId === authorId || currentUserId === authorId.toString()
        
        // Also check if emails match with fetched author data
        const emailMatch = (
          currentUserEmail && 
          (currentUserEmail === game.author.email || currentUserEmail === authorData?.email)
        )
        
        return idMatch || emailMatch
      }
    }
    
    // Case 3: Try to use authorData directly
    if (authorData) {
      // @ts-ignore - TypeScript doesn't know about id
      return currentUserId === authorData.id || currentUserEmail === authorData.email
    }
    
    // No reliable way to determine authorship
    return false
  }

  // Get author name from either the game.author or the fetched authorData
  const getAuthorDisplayName = () => {
    // If we have fetched author data, use that first
    if (authorData) {
      return authorData.name || authorData.username || authorData.displayName || 'Unknown Author'
    }
    
    // Handle case where author is a string ID
    if (typeof game?.author === 'string') {
      return 'Author' // We can't display name until author data loads
    }
    
    // Try to get name from game.author object if it exists
    if (game?.author?.name) {
      return game.author.name
    }
    
    return 'Unknown Author'
  }

  // Get author image from either game.author or fetched authorData
  const getAuthorImage = () => {
    // If we have fetched author data, use that first
    if (authorData?.image) {
      return authorData.image
    }
    
    // Try to get from game.author if it's an object with an image
    if (game?.author?.image) {
      return game.author.image
    }
    
    return null // No image available
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Handler for liking and unliking a game
  const handleLikeToggle = async () => {
    if (!session) {
      // Redirect to sign in if not logged in
      router.push('/auth/signin');
      return;
    }

    if (isLiking || !game) return;

    setIsLiking(true);
    
    try {
      // If already liked, unlike the game
      if (hasLiked) {
        const response = await fetch(`/api/games/${game.id}/like`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to unlike game');
        }

        // Update local state to reflect the unlike
        setHasLiked(false);
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            likes: Math.max(0, prev.likes - 1) // Ensure likes don't go below 0
          };
        });

        console.log('Game unliked successfully');
      } 
      // Otherwise, like the game
      else {
        const response = await fetch(`/api/games/${game.id}/like`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to like game');
        }

        // Update local state to reflect the like
        setHasLiked(true);
        setGame(prev => {
          if (!prev) return null;
          return {
            ...prev,
            likes: prev.likes + 1
          };
        });

        console.log('Game liked successfully');
      }
    } catch (error) {
      console.error(`Error ${hasLiked ? 'unliking' : 'liking'} game:`, error);
    } finally {
      setIsLiking(false);
    }
  };

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
                  {getAuthorImage() ? (
                    <img src={getAuthorImage()} alt={getAuthorDisplayName()} />
                  ) : (
                    <FontAwesomeIcon icon={faUser} />
                  )}
                </div>
                <span>by {getAuthorDisplayName()}</span>
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
            
            <Link href={`/play/${game.id}`} className="play-outline-button">
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
                {isCurrentUserAuthor() && (
                  <Link href={`/edit-game/${game.id}`} className="edit-button">
                    <FontAwesomeIcon icon={faEdit} /> Edit Game
                  </Link>
                )}
                
                <button 
                  className={`like-button ${hasLiked ? 'liked' : ''}`} 
                  onClick={handleLikeToggle}
                  disabled={isLiking}
                >
                  <FontAwesomeIcon icon={faHeart} /> 
                  {hasLiked ? 'Unlike' : 'Like'}
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
          margin: 80px auto;
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

        .game-category {
          position: relative;
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
          transition: all 0.3s;
          text-decoration: none;
        }
        
        .edit-button:hover, .like-button:hover:not(:disabled) {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .like-button {
          color: var(--primary-color);
          transition: all 0.3s;
        }
        
        .like-button.liked {
          background-color: var(--primary-color);
          color: white;
        }
        
        .like-button.liked:hover:not(:disabled) {
          background-color: #f44336; /* Red color for unlike hover */
        }
        
        .like-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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