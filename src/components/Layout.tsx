import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faSignInAlt, faUserShield } from '@fortawesome/free-solid-svg-icons';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'GrokGames.dev' }: LayoutProps) {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="GrokGames.dev - Play and share games with friends" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <div className="header-container">
          <Link href="/" className="logo">
            GrokGames.dev
          </Link>

          <nav className="nav">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/games" className="nav-link">
              Games
            </Link>
            {isAdmin && (
              <Link href="/admin" className="nav-link admin-link">
                <FontAwesomeIcon icon={faUserShield} className="nav-icon" />
                Admin
              </Link>
            )}
          </nav>

          <div className="auth-buttons">
            {status === 'authenticated' ? (
              <>
                <Link href="/profile" className="auth-button profile-button">
                  <FontAwesomeIcon icon={faUser} className="auth-icon" />
                  Profile
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="auth-button signout-button"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} className="auth-icon" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/api/auth/signin" className="auth-button signin-button">
                <FontAwesomeIcon icon={faSignInAlt} className="auth-icon" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; {new Date().getFullYear()} GrokGames.dev. All rights reserved.</p>
        </div>
      </footer>

      <style jsx>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background-color: var(--header-bg);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary-color);
          text-decoration: none;
        }

        .nav {
          display: flex;
          gap: 1.5rem;
        }

        .nav-link {
          color: var(--text-color);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link:hover {
          color: var(--primary-color);
        }

        .admin-link {
          color: var(--primary-color);
        }

        .auth-buttons {
          display: flex;
          gap: 1rem;
        }

        .auth-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.2s;
        }

        .profile-button {
          background-color: var(--btn-secondary-bg);
          color: var(--btn-secondary-text);
        }

        .profile-button:hover {
          background-color: var(--btn-secondary-hover);
        }

        .signin-button {
          background-color: var(--primary-color);
          color: white;
        }

        .signin-button:hover {
          background-color: var(--primary-hover);
        }

        .signout-button {
          background-color: var(--btn-danger-bg, #ef4444);
          color: white;
        }

        .signout-button:hover {
          background-color: var(--btn-danger-hover, #dc2626);
        }

        .footer {
          background-color: var(--footer-bg);
          padding: 2rem 0;
          margin-top: 3rem;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          text-align: center;
          color: var(--text-muted);
        }
      `}</style>

      <style jsx global>{`
        :root {
          --primary-color: #6d28d9;
          --primary-hover: #5b21b6;
          --background-dark: #121212;
          --card-bg: #1e1e1e;
          --card-header-bg: #252525;
          --text-color: #e5e5e5;
          --text-muted: #a3a3a3;
          --border-color: #333333;
          --header-bg: #1a1a1a;
          --footer-bg: #1a1a1a;
          --input-bg: #2a2a2a;
          --btn-secondary-bg: #374151;
          --btn-secondary-text: #e5e5e5;
          --btn-secondary-hover: #4b5563;
          --badge-bg: #374151;
          --badge-text: #e5e5e5;
          --badge-admin-bg: #7c3aed;
          --badge-pro-bg: #0ea5e9;
          --btn-danger-bg: #ef4444;
          --btn-danger-hover: #dc2626;
          --btn-success-bg: #10b981;
          --btn-success-hover: #059669;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html,
        body {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
            Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          background-color: var(--background-dark);
          color: var(--text-color);
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
          font-size: inherit;
          border: none;
          background: none;
          padding: 0;
          margin: 0;
          cursor: pointer;
          color: inherit;
        }
      `}</style>
    </>
  );
} 