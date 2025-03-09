import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AdminHeader from '../../components/AdminHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUserShield, faCrown, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    proUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        // Redirect non-admin users to home page
        router.push('/');
      } else {
        // Fetch dashboard stats
        fetchStats();
      }
    } else if (status === 'unauthenticated') {
      // Redirect unauthenticated users to login
      router.push('/api/auth/signin');
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch admin stats');
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runSeed = async () => {
    if (confirm('Are you sure you want to seed the database? This will create demo users and games if they don\'t exist.')) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/seed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          alert('Database seeded successfully!');
          // Refresh stats after seeding
          fetchStats();
        } else {
          console.error('Failed to seed database:', data.message);
          alert(`Failed to seed database: ${data.message}`);
        }
      } catch (error) {
        console.error('Error seeding database:', error);
        alert('Error seeding database. See console for details.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'admin' && isLoading)) {
    return (
      <AdminHeader>
        <div className="admin-loading">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
          <p>Loading admin dashboard...</p>
        </div>
      </AdminHeader>
    );
  }

  // Only render dashboard if user is authenticated and is an admin
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return (
      <AdminHeader>
        <div className="admin-dashboard">
          <div className="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Welcome, {session.user.name}!</p>
          </div>

          <div className="admin-stats">
            <div className="stat-card">
              <FontAwesomeIcon icon={faUsers} className="stat-icon" />
              <div className="stat-content">
                <h3>Total Users</h3>
                <p className="stat-value">{isLoading ? '...' : stats.totalUsers}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <FontAwesomeIcon icon={faUserShield} className="stat-icon" />
              <div className="stat-content">
                <h3>Admin Users</h3>
                <p className="stat-value">{isLoading ? '...' : stats.adminUsers}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <FontAwesomeIcon icon={faCrown} className="stat-icon" />
              <div className="stat-content">
                <h3>Pro Users</h3>
                <p className="stat-value">{isLoading ? '...' : stats.proUsers}</p>
              </div>
            </div>
          </div>

          <div className="admin-actions">
            <h2>Management</h2>
            <div className="action-cards">
              <Link href="/admin/users" className="action-card">
                <h3>User Management</h3>
                <p>View, edit, and manage user accounts and roles</p>
              </Link>
              
              <Link href="/admin/settings" className="action-card">
                <h3>Site Settings</h3>
                <p>Configure global site settings and preferences</p>
              </Link>
            </div>
          </div>

          <div className="admin-tools">
            <h2>Admin Tools</h2>
            <div className="tools-container">
              <button 
                onClick={runSeed} 
                className="tool-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin className="button-icon" />
                    Seeding...
                  </>
                ) : (
                  <>Seed Database</>
                )}
              </button>
            </div>
          </div>
        </div>

        <style jsx>{`
          .admin-dashboard {
            padding: 2rem;
            padding-top: 80px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .admin-header {
            margin-bottom: 2rem;
          }
          
          .admin-header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
          }
          
          .admin-stats {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2.5rem;
          }
          
          .stat-card {
            background-color: var(--card-bg);
            border-radius: 8px;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .stat-icon {
            font-size: 2.5rem;
            margin-right: 1.5rem;
            color: var(--primary-color);
          }
          
          .stat-content h3 {
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
            color: var(--text-muted);
          }
          
          .stat-value {
            font-size: 2rem;
            font-weight: bold;
          }
          
          .admin-actions {
            margin-top: 2rem;
          }
          
          .admin-actions h2 {
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
          }
          
          .action-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 1.5rem;
          }
          
          .action-card {
            background-color: var(--card-bg);
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s, box-shadow 0.2s;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
          }
          
          .action-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          }
          
          .action-card h3 {
            margin-bottom: 0.75rem;
            font-size: 1.25rem;
            color: var(--primary-color);
          }
          
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 50vh;
            font-size: 1.2rem;
          }
          
          .loading-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--primary-color);
          }
          
          .admin-tools {
            margin-top: 2rem;
          }
          
          .admin-tools h2 {
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
          }
          
          .tools-container {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
          }
          
          .tool-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .tool-button:hover {
            background-color: var(--primary-hover);
          }
          
          .tool-button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          
          .button-icon {
            font-size: 1rem;
          }
        `}</style>
      </AdminHeader>
    );
  }

  // This should not be visible due to redirects, but just in case
  return null;
} 