import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompass, faGamepad, faUser, faSignOutAlt, faUpload } from '@fortawesome/free-solid-svg-icons'
import { useEffect, useState } from 'react'

export default function Header() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      if (offset > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
      <nav className="main-nav">
        <Link href="/" className="logo">GrokGames.dev</Link>
        <div className="nav-links">
          <Link href="/discover" className="nav-link">
            <FontAwesomeIcon icon={faCompass} className="nav-icon" />
            Discover
          </Link>
          {isAuthenticated ? (
            <>
              <Link href="/my-games" className="nav-link">
                <FontAwesomeIcon icon={faGamepad} className="nav-icon" />
                My Games
              </Link>
              <div className="user-menu">
                <div className="user-avatar">
                  {session?.user?.image ? (
                    <img src={session.user.image} alt={session.user.name || 'User'} />
                  ) : (
                    <FontAwesomeIcon icon={faUser} />
                  )}
                </div>
                <div className="dropdown-menu">
                  <div className="user-info">
                    <span className="user-name">{session?.user?.name}</span>
                    <span className="user-email">{session?.user?.email}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  
                  <button 
                    onClick={() => router.push('/upload-game')} 
                    className="dropdown-item"
                  >
                    <FontAwesomeIcon icon={faUpload} className="item-icon" />
                    <span>Upload Game</span>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/profile')} 
                    className="dropdown-item"
                  >
                    <FontAwesomeIcon icon={faUser} className="item-icon" />
                    <span>Profile</span>
                  </button>
                  
                  <button 
                    onClick={() => signOut()} 
                    className="dropdown-item"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} className="item-icon" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link href="/auth/signin" className="nav-link">
              <FontAwesomeIcon icon={faUser} className="nav-icon" />
              Sign In
            </Link>
          )}
        </div>
      </nav>

      <style jsx>{`
        .main-header {
          position: fixed; /* Change from sticky to fixed for consistent positioning */
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          background-color: rgba(10, 10, 20, 0.65);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 100;
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.15);
          padding: 0.75rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          height: 80px; /* Fixed height to prevent movement */
          display: flex;
          align-items: center;
          transition: background-color 0.3s ease; /* Only transition background color */
        }
        
        /* Darken header slightly on hover for visual feedback */
        .main-header:hover {
          background-color: rgba(10, 10, 20, 0.75);
        }
        
        /* When scrolling, make header slightly more opaque */
        .main-header.scrolled {
          background-color: rgba(10, 10, 20, 0.8);
        }
        
        .main-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--primary-color);
          text-decoration: none;
          text-shadow: 0 0 10px rgba(124, 104, 242, 0.3);
          transition: all 0.3s ease;
        }
        
        .logo:hover {
          text-shadow: 0 0 15px rgba(124, 104, 242, 0.5);
          transform: scale(1.02);
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-color);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
        }
        
        .nav-link:hover {
          color: var(--primary-color);
        }
        
        .nav-icon {
          font-size: 1rem;
        }
        
        .user-menu {
          position: relative;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: var(--primary-color);
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          cursor: pointer;
          overflow: hidden;
        }
        
        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* Create a pseudo-element to bridge the gap between avatar and dropdown */
        .user-menu::after {
          content: '';
          position: absolute;
          top: 100%;
          right: 0;
          width: 100%;
          height: 15px; /* Height of the bridge */
          background-color: transparent; /* Invisible bridge */
        }
        
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 15px); /* Position below the bridge */
          width: 200px;
          background-color: var(--card-bg);
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          padding: 1rem;
          display: none;
          z-index: 10;
        }
        
        /* Add padding to the top of the dropdown to expand hover area */
        .dropdown-menu::before {
          content: '';
          position: absolute;
          top: -15px; /* Match the bridge height */
          left: 0;
          width: 100%;
          height: 15px;
          background-color: transparent; /* Invisible padding */
        }
        
        .user-menu:hover .dropdown-menu {
          display: block;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          margin-bottom: 0.75rem;
        }
        
        .user-name {
          font-weight: 600;
        }
        
        .user-email {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: rgba(255, 255, 255, 0.1);
          margin: 0.5rem 0;
        }
        
        .dropdown-item-wrapper {
          display: block;
          width: 100%;
          margin-bottom: 0.25rem;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          color: var(--text-color);
          text-decoration: none;
          border-radius: 4px;
          font-size: 0.9rem;
          transition: background-color 0.3s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          box-sizing: border-box;
        }
        
        /* Force links to be block elements */
        a.dropdown-item {
          display: flex;
          width: 100%;
        }
        
        .dropdown-item span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dropdown-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .item-icon {
          font-size: 0.9rem;
          width: 16px;
        }
      `}</style>
    </header>
  )
}