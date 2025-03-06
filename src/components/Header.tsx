import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCompass, faGamepad, faUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'

export default function Header() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'

  return (
    <header className="main-header">
      <nav className="main-nav">
        <Link href="/" className="logo">Discount Games</Link>
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
                  <Link href="/profile" className="dropdown-item">
                    Profile
                  </Link>
                  <button onClick={() => signOut()} className="dropdown-item">
                    <FontAwesomeIcon icon={faSignOutAlt} className="item-icon" />
                    Sign Out
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
        
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 45px;
          width: 200px;
          background-color: var(--card-bg);
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
          padding: 1rem;
          display: none;
          z-index: 10;
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
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          color: var(--text-color);
          text-decoration: none;
          border-radius: 4px;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
          transition: background-color 0.3s;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
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