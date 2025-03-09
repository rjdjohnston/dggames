import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

export default function AdminTest() {
  const { data: session, status, update } = useSession();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const makeAdmin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      
      console.log('Attempting to make user an admin...');
      
      const response = await fetch('/api/user/set-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(data);
      
      if (response.ok) {
        // Force a session refresh to get the updated role
        await update();
      } else {
        setError(data.message || 'Failed to set admin role');
      }
    } catch (error) {
      console.error('Error setting admin role:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-test-page">
      <Head>
        <title>Admin Test Page</title>
      </Head>
      
      <div className="container">
        <h1>Admin Role Test Page</h1>
        
        <div className="session-info">
          <h2>Session Information</h2>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
        
        <div className="actions">
          <h2>Actions</h2>
          <button 
            onClick={makeAdmin} 
            disabled={isLoading || status !== 'authenticated'}
            className="admin-button"
          >
            {isLoading ? 'Processing...' : 'Make Me Admin'}
          </button>
          
          <button 
            onClick={() => update()} 
            disabled={isLoading || status !== 'authenticated'}
            className="refresh-button"
          >
            Refresh Session
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="result">
            <h2>Result</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        <div className="environment-info">
          <h2>Environment Information</h2>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
        </div>
      </div>
      
      <style jsx>{`
        .admin-test-page {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .container {
          background-color: var(--card-bg, #1e1e1e);
          border-radius: 8px;
          padding: 2rem;
        }
        
        h1 {
          margin-bottom: 2rem;
        }
        
        h2 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        pre {
          background-color: rgba(0, 0, 0, 0.2);
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        
        .actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        button {
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .admin-button {
          background-color: var(--badge-admin-bg, #7c3aed);
          color: white;
        }
        
        .refresh-button {
          background-color: var(--btn-secondary-bg, #374151);
          color: var(--btn-secondary-text, #e5e5e5);
        }
        
        .error-message {
          background-color: rgba(239, 68, 68, 0.2);
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
        }
        
        .result {
          background-color: rgba(16, 185, 129, 0.2);
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 2rem;
        }
      `}</style>
    </div>
  );
} 