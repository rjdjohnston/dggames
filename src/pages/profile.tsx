import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Header from '../components/Header'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faUser } from '@fortawesome/free-solid-svg-icons'

export default function Profile() {
  const { data: session, status } = useSession()
  
  const [name, setName] = useState(session?.user?.name || '')
  const [bio, setBio] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  
  if (status === 'loading') {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  }
  
  if (status === 'unauthenticated') {
    signIn()
    return null
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would update the user profile via API
    // For demo purposes, we'll just show a success message
    setTimeout(() => {
      setUpdateSuccess(true)
      // Hide the message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000)
    }, 500)
  }
  
  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-container">
        <h1>Your Profile</h1>
        
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="avatar-container">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className="profile-avatar" 
                />
              ) : (
                <div className="default-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              )}
              <button className="change-avatar-btn">Change Avatar</button>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <div className="stat-value">12</div>
                <div className="stat-label">Games Created</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">42</div>
                <div className="stat-label">Days Active</div>
              </div>
            </div>
          </div>
          
          <div className="profile-form-container">
            {updateSuccess && (
              <div className="success-message">
                Profile updated successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  value={session?.user?.email || ''} 
                  disabled 
                  className="disabled-input"
                />
                <span className="input-note">Email cannot be changed</span>
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Display Name</label>
                <input 
                  type="text" 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                ></textarea>
              </div>
              
              <button type="submit" className="save-button">
                <FontAwesomeIcon icon={faSave} /> Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .profile-page {
          min-height: 100vh;
          background-color: var(--background-dark);
          color: var(--text-color);
        }
        
        .profile-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        h1 {
          margin-bottom: 2rem;
          font-size: 2rem;
        }
        
        .profile-content {
          display: flex;
          gap: 2rem;
        }
        
        .profile-sidebar {
          width: 260px;
          flex-shrink: 0;
        }
        
        .avatar-container {
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .profile-avatar {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          margin-bottom: 1rem;
          object-fit: cover;
        }
        
        .default-avatar {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background-color: var(--primary-color);
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .change-avatar-btn {
          background-color: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .change-avatar-btn:hover {
          background-color: var(--primary-color);
          color: white;
        }
        
        .profile-stats {
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-around;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--primary-color);
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .profile-form-container {
          flex: 1;
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 2rem;
        }
        
        .success-message {
          background-color: rgba(76, 175, 80, 0.1);
          border-left: 4px solid #4caf50;
          color: #4caf50;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 4px;
        }
        
        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        label {
          font-weight: 500;
          font-size: 0.9rem;
        }
        
        input, textarea {
          padding: 0.8rem 1rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: var(--text-color);
          font-size: 1rem;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        
        .disabled-input {
          background-color: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.5);
          cursor: not-allowed;
        }
        
        .input-note {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .save-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.8rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .save-button:hover {
          background-color: var(--hover-color);
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          color: var(--text-color);
        }
        
        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
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
          .profile-content {
            flex-direction: column;
          }
          
          .profile-sidebar {
            width: 100%;
            margin-bottom: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}