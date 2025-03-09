import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faSearch, faEdit, faCheck, faTimes, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Image from 'next/image';

// Define user type
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  image: string;
  provider: string;
  createdAt: string;
}

export default function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);
  const usersPerPage = 10;

  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        // Redirect non-admin users to home page
        router.push('/');
      } else {
        // Fetch users
        fetchUsers();
      }
    } else if (status === 'unauthenticated') {
      // Redirect unauthenticated users to login
      router.push('/api/auth/signin');
    }
  }, [status, session, router, currentPage]);

  useEffect(() => {
    if (users.length > 0) {
      filterUsers();
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users?page=${currentPage}&limit=${usersPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
        setTotalPages(Math.ceil(data.total / usersPerPage));
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const startEditing = (user: User) => {
    setEditingUser(user._id);
    setSelectedRole(user.role);
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setSelectedRole('');
  };

  const updateUserRole = async (userId: string) => {
    if (!selectedRole) return;
    
    try {
      setIsUpdating(true);
      const response = await fetch('/api/admin/users/update-role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: selectedRole,
        }),
      });

      if (response.ok) {
        // Update local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user._id === userId ? { ...user, role: selectedRole } : user
          )
        );
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(`Failed to update user role: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('An error occurred while updating the user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'admin' && isLoading)) {
    return (
      <div className="admin-loading">
        <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
        <p>Loading user management...</p>
      </div>
    );
  }

  // Only render page if user is authenticated and is an admin
  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return (
      <div className="user-management">
        <div className="admin-header">
          <Link href="/admin" className="back-link">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Dashboard
          </Link>
          <h1>User Management</h1>
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Provider</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <tr key={user._id}>
                        <td className="user-cell">
                          <div className="user-avatar">
                            {user.image ? (
                              <Image 
                                src={user.image} 
                                alt={user.name} 
                                width={40} 
                                height={40}
                                className="avatar-img"
                              />
                            ) : (
                              <div className="avatar-placeholder">{user.name.charAt(0)}</div>
                            )}
                          </div>
                          <span className="user-name">{user.name}</span>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.provider}</td>
                        <td>
                          {editingUser === user._id ? (
                            <select 
                              value={selectedRole} 
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="role-select"
                              disabled={isUpdating}
                            >
                              <option value="user">User</option>
                              <option value="pro">Pro</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`role-badge role-${user.role}`}>
                              {user.role}
                            </span>
                          )}
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          {editingUser === user._id ? (
                            <div className="action-buttons">
                              <button 
                                onClick={() => updateUserRole(user._id)} 
                                className="action-btn save-btn"
                                disabled={isUpdating}
                              >
                                {isUpdating ? (
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                  <FontAwesomeIcon icon={faCheck} />
                                )}
                              </button>
                              <button 
                                onClick={cancelEditing} 
                                className="action-btn cancel-btn"
                                disabled={isUpdating}
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(user)} 
                              className="action-btn edit-btn"
                              disabled={session.user.id === user._id} // Prevent editing own role
                              title={session.user.id === user._id ? "You cannot change your own role" : "Edit user role"}
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="no-results">
                        No users found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        <style jsx>{`
          .user-management {
            padding: 2rem;
            padding-top: 80px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .admin-header {
            margin-bottom: 2rem;
          }
          
          .back-link {
            display: inline-block;
            margin-bottom: 1rem;
            color: var(--primary-color);
            text-decoration: none;
          }
          
          .back-link:hover {
            text-decoration: underline;
          }
          
          .admin-header h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          
          .search-container {
            position: relative;
            max-width: 500px;
          }
          
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
          }
          
          .search-input {
            width: 100%;
            padding: 10px 10px 10px 40px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background-color: var(--input-bg);
            color: var(--text-color);
            font-size: 1rem;
          }
          
          .users-table-container {
            overflow-x: auto;
            background-color: var(--card-bg);
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .users-table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .users-table th,
          .users-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
          }
          
          .users-table th {
            background-color: var(--card-header-bg);
            font-weight: 600;
          }
          
          .user-cell {
            display: flex;
            align-items: center;
          }
          
          .user-avatar {
            margin-right: 1rem;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            background-color: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .avatar-placeholder {
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
          }
          
          .avatar-img {
            object-fit: cover;
            border-radius: 50%;
          }
          
          .role-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            text-transform: capitalize;
          }
          
          .role-user {
            background-color: var(--badge-bg);
            color: var(--badge-text);
          }
          
          .role-admin {
            background-color: var(--badge-admin-bg, #7c3aed);
            color: white;
          }
          
          .role-pro {
            background-color: var(--badge-pro-bg, #0ea5e9);
            color: white;
          }
          
          .role-select {
            padding: 0.5rem;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            background-color: var(--input-bg);
            color: var(--text-color);
          }
          
          .action-buttons {
            display: flex;
            gap: 0.5rem;
          }
          
          .action-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }
          
          .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .edit-btn {
            background-color: var(--btn-secondary-bg);
            color: var(--btn-secondary-text);
          }
          
          .save-btn {
            background-color: var(--btn-success-bg, #10b981);
            color: white;
          }
          
          .cancel-btn {
            background-color: var(--btn-danger-bg, #ef4444);
            color: white;
          }
          
          .loading-container,
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 0;
          }
          
          .loading-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: var(--primary-color);
          }
          
          .no-results {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
          }
          
          .pagination {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 2rem;
            gap: 1rem;
          }
          
          .pagination-btn {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            background-color: var(--btn-secondary-bg);
            color: var(--btn-secondary-text);
            cursor: pointer;
          }
          
          .pagination-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          .page-info {
            font-size: 0.9rem;
            color: var(--text-muted);
          }
        `}</style>
      </div>
    );
  }

  // This should not be visible due to redirects, but just in case
  return null;
} 