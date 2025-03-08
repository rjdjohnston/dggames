import Header from '../components/Header'
import GamesList from '../components/GamesList'

export default function PopularGames() {
  return (
    <div className="container mx-auto">
      <Header />

      <main className="page-container">
        <div className="page-header">
          <h1>Popular Games</h1>
          <p>The most played games on our platform</p>
        </div>

        <GamesList 
          title="Most Played" 
          endpoint="/api/games?sort=plays&order=desc" 
          showSearch={true}
        />
        
        <GamesList 
          title="Most Liked" 
          endpoint="/api/games?sort=likes&order=desc" 
          limit={6}
          showSearch={false}
        />
      </main>

      <style jsx>{`
        .page-container {
          padding: 2rem;
          max-width: 1200px;
          margin: 80px auto;
        }
        
        .page-header {
          margin-bottom: 2rem;
        }
        
        h1 {
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
        }
        
        p {
          color: var(--text-secondary);
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .page-container {
            padding: 1rem;
          }
          
          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
} 