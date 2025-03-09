import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons'
import Header from '../components/Header'

interface Game {
  id?: string
  _id?: string  // MongoDB might return _id instead of id
  title: string
  description: string
  category: string
  image: string
  lastUpdated: string
  progress: number
}

export default function MyGames() {
  const { data: session, status } = useSession()
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [gameToDelete, setGameToDelete] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    if (status === 'unauthenticated') {
      signIn()
      return
    }

    if (status === 'authenticated') {
      // Fetch games from the API
      fetch('/api/user/games')
        .then(res => res.json())
        .then(data => {
          console.log('API response:', data);
          // Transform data to ensure each game has an id property
          const gamesArray = Array.isArray(data) ? data.map(game => ({
            ...game,
            id: game.id || game._id  // Use id if available, fallback to _id
          })) : [];
          console.log('Games array:', gamesArray);
          setGames(gamesArray)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Error fetching games:', error)
          setIsLoading(false)
        })
    }
  }, [status])

  const handlePlay = (gameId: string) => {
    console.log('Playing game with ID:', gameId);
    if (!gameId) {
      console.error('No game ID provided');
      return;
    }
    router.push(`/play/${gameId}`);
  }

  const handleEdit = (gameId: string) => {
    router.push(`/edit-game/${gameId}`)
  }

  const openDeleteModal = (gameId: string) => {
    setGameToDelete(gameId)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setGameToDelete(null)
  }

  const handleDelete = async () => {
    if (!gameToDelete) return

    try {
      const response = await fetch(`/api/games/${gameToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove the game from the list
        setGames(games.filter(game => game.id !== gameToDelete))
        closeDeleteModal()
      } else {
        console.error('Failed to delete game')
      }
    } catch (error) {
      console.error('Error deleting game:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your games...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <Header />

      <main className="main-content">
        <div className="parallax-background"></div>
        
        <section className="my-games-section">
          <header className="page-header">
            <h1>My Games</h1>
            <Link href="/upload-game" className="create-button">
              <FontAwesomeIcon icon={faPlus} /> New Game
            </Link>
          </header>

          {games.length === 0 ? (
            <div className="empty-state">
              <h2>You haven't created any games yet</h2>
              <p>Start your first adventure by creating a new game!</p>
              <Link href="/upload-game" className="empty-state-button">
                <FontAwesomeIcon icon={faPlus} /> Create Your First Game
              </Link>
            </div>
          ) : (
            <div className="games-grid">
              {games.map((game) => {
                const gameId = game.id || game._id;
                return (
                  <div key={gameId} className="game-card">
                    <div className="game-image">
                      <img src={game.image} alt={game.title} />
                      <div className="game-category">{game.category}</div>
                      <div className="game-actions">
                        <button 
                          className="action-button play"
                          onClick={() => {
                            console.log('Play button clicked with ID:', gameId);
                            handlePlay(gameId as string);
                          }}
                          aria-label="Play game"
                        >
                          <FontAwesomeIcon icon={faPlay} />
                        </button>
                        <button 
                          className="action-button edit"
                          onClick={() => handleEdit(gameId as string)}
                          aria-label="Edit game"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => openDeleteModal(gameId as string)}
                          aria-label="Delete game"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                    <div className="game-info" style={{ 
                      backgroundImage: `url(${game.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative'
                    }}>
                      <div className="game-info-blur"></div>
                      <div className="game-info-content">
                        <h3>{game.title}</h3>
                        <p>{game.description?.length > 100 
                            ? `${game.description.substring(0, 100)}...` 
                            : game.description}</p>
                        
                        <div className="game-meta">
                          Last played: {formatDate(game.lastUpdated)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModalOpen && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Delete Game</h3>
                <p>Are you sure you want to delete this game? This cannot be undone.</p>
                <div className="modal-actions">
                  <button onClick={closeDeleteModal} className="cancel-button">
                    Cancel
                  </button>
                  <button onClick={handleDelete} className="delete-button">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      
      <style jsx>{`
        .main-content {
          padding-top: 80px; /* Same as header height to prevent content from being hidden */
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
        
        .my-games-section {
          background-color: rgba(10, 10, 20, 0.7);
          backdrop-filter: blur(3px);
          border-radius: 8px;
          padding: 2rem;
          margin: 2rem 1rem;
          margin-left: auto;
          margin-right: auto;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(45deg, var(--primary-color), #9c88ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .create-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.7rem 1.2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .create-button:hover {
          background-color: var(--hover-color);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124, 104, 242, 0.4);
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        
        .empty-state h2 {
          margin-bottom: 1rem;
          color: var(--text-color);
        }
        
        .empty-state p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }
        
        .empty-state-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem 1.5rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .empty-state-button:hover {
          background-color: var(--hover-color);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(124, 104, 242, 0.4);
        }
        
        .games-grid {
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
          top: 10px;
          left: 10px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        
        .game-actions {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          gap: 0.5rem;
        }
        
        .action-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 0.8rem;
        }
        
        .action-button.play {
          background-color: var(--primary-color);
          color: white;
        }
        
        .action-button.play:hover {
          background-color: var(--hover-color);
          transform: scale(1.1);
        }
        
        .action-button.edit {
          background-color: #4caf50;
          color: white;
        }
        
        .action-button.edit:hover {
          background-color: #388e3c;
          transform: scale(1.1);
        }
        
        .action-button.delete {
          background-color: #f44336;
          color: white;
        }
        
        .action-button.delete:hover {
          background-color: #d32f2f;
          transform: scale(1.1);
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
          backdrop-filter: blur(100px); /* Extreme blur as requested */
          -webkit-backdrop-filter: blur(100px);
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
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: auto;
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        
        .modal-content {
          background-color: var(--card-bg);
          border-radius: 8px;
          padding: 1.5rem;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .cancel-button, .delete-button {
          padding: 0.6rem 1rem;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .cancel-button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }
        
        .delete-button {
          background-color: #f44336;
          color: white;
        }
        
        .cancel-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .delete-button:hover {
          background-color: #d32f2f;
          transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
          .my-games-section {
            padding: 1.5rem;
            margin: 1rem;
          }
          
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .games-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
} 