import Header from '../components/Header'
import GamesList from '../components/GamesList'

export default function Discover() {
  return (
    <div className="container mx-auto">
      <Header />

      <main className="main-content">
        <div className="parallax-background"></div>
        
        <section className="discover-section">
          <div className="discover-header">
            <h1>Discover Games</h1>
            <p className="discover-description">
              Explore our collection of AI-powered interactive games created by the community.
              Find your next adventure or create your own!
            </p>
          </div>
          </section>
          <section className="games-section">
          <GamesList 
            title="Featured Games" 
            endpoint="/api/games" 
            emptyMessage="Be the first to create a new game!"
          />
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
        
        .discover-section {
          background-color: rgba(10, 10, 20, 0.7);
          backdrop-filter: blur(3px);
          border-radius: 8px;
          padding: 2rem;
          margin: 2rem 1rem;
          margin-left: auto;
          margin-right: auto;
        }
        
        .discover-header {
          margin-bottom: 2rem;
          text-align: center;
        }
        
        h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 1rem 0;
          background: linear-gradient(45deg, var(--primary-color), #9c88ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .discover-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.9);
          max-width: 800px;
          margin: 0 auto;
        }
        
        @media (max-width: 768px) {
          .discover-section {
            padding: 1.5rem;
            margin: 1rem;
          }
          
          h1 {
            font-size: 2rem;
          }
          
          .discover-description {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  )
}