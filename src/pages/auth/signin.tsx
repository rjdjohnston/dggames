import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { callbackUrl } = router.query

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
        return
      }

      // Redirect to the callback URL or to the homepage
      router.push('/my-games')
    } catch (error) {
      setError('An error occurred during sign in')
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign In</h1>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">
              <FontAwesomeIcon icon={faUser} /> Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <FontAwesomeIcon icon={faLock} /> Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>Don't have an account? <Link href="/auth/signup">Sign Up</Link></p>
          <Link href="/">Back to Home</Link>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: var(--background-dark);
        }
        
        .auth-card {
          background-color: var(--secondary-bg);
          border-radius: 10px;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        h1 {
          color: var(--text-color);
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .auth-error {
          background-color: rgba(255, 0, 0, 0.1);
          border-left: 4px solid #ff4444;
          color: #ff4444;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 4px;
        }
        
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        label {
          color: var(--text-color);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        input {
          padding: 0.8rem 1rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: var(--text-color);
          font-size: 1rem;
        }
        
        input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        
        .auth-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          margin-top: 1rem;
        }
        
        .auth-button:hover {
          background-color: var(--hover-color);
        }
        
        .auth-button:disabled {
          background-color: #505050;
          cursor: not-allowed;
        }
        
        .auth-links {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .auth-links a {
          color: var(--primary-color);
          text-decoration: none;
        }
        
        .auth-links a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
} 