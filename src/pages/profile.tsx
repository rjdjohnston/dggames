import { useState, useRef, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Header from '../components/Header'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSave, faUser, faUpload, faSpinner, faSync, faUserShield } from '@fortawesome/free-solid-svg-icons'
import Image from 'next/image'
import Link from 'next/link'

const isDevelopment = process.env.NODE_ENV === 'development';

export default function Profile() {
  const { data: session, status, update } = useSession()
  
  // All state hooks must be declared at the top level, not conditionally
  const [name, setName] = useState(session?.user?.name || '')
  const [bio, setBio] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarKey, setAvatarKey] = useState(Date.now()) // For cache busting
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<{
    sessionStatus: string;
    userId: string | undefined;
    userName: string | null | undefined;
    userEmail: string | null | undefined;
    userImage: string | null | undefined;
    userRole: string | undefined;
    processedImageUrl: string;
    avatarKey: number;
    uploadState: string;
    sessionCheck: any | null;
    schemaCheck: any | null;
  }>({
    sessionStatus: '',
    userId: '',
    userName: '',
    userEmail: '',
    userImage: '',
    userRole: '',
    processedImageUrl: '',
    avatarKey: 0,
    uploadState: '',
    sessionCheck: null,
    schemaCheck: null
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Update name state when session changes
  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name)
    }
  }, [session])
  
  // Create a loading component to avoid conditional rendering of hooks
  const LoadingComponent = () => (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    )
  
  // Create an authentication component to avoid conditional rendering of hooks
  const AuthenticationComponent = () => {
    // This effect will run when the component is mounted
    useEffect(() => {
    signIn()
    }, [])
    
    return null
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Update user profile
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      setUpdateSuccess(true)
      // Hide the message after 3 seconds
      setTimeout(() => setUpdateSuccess(false), 3000)
      
      // Update the session to reflect the changes
      await update({ name })
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }
  
  const handleAvatarClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click()
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset states
    setUploadError('')
    setAvatarFile(file)
    
    // Create a preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  const uploadAvatar = async () => {
    if (!avatarFile) return
    
    setIsUploading(true)
    setUploadError('')
    
    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)
      
      console.log('Uploading avatar...')
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to upload avatar')
      }
      
      const data = await response.json()
      console.log('Upload response:', data)
      
      // Update the avatar key for cache busting
      setAvatarKey(Date.now())
      
      // Force a complete session refresh to get the new image URL
      console.log('Updating session with new image URL:', data.imageUrl)
      await update({ image: data.imageUrl })
      
      // Force a reload of the session after a short delay to ensure it's updated
      setTimeout(async () => {
        console.log('Forcing session reload...')
        await update()
        console.log('Session after reload:', session)
    }, 500)
      
      // Reset states
      setAvatarFile(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setUploadError(error instanceof Error ? error.message : 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
    }
  }
  
  // Force refresh the avatar image (useful for cache issues)
  const forceRefreshAvatar = () => {
    setAvatarKey(Date.now())
  }
  
  // Get avatar URL with cache busting
  const getAvatarUrl = () => {
    if (!session?.user?.image) return '';
    
    // If the URL already has a query parameter, append the key
    if (session.user.image.includes('?')) {
      return `${session.user.image}&_=${avatarKey}`
    }
    
    // Otherwise add a new query parameter
    return `${session.user.image}?_=${avatarKey}`
  }
  
  // Debug information
  const toggleDebug = () => setShowDebug(!showDebug);
  
  // Add this function to check if debug should be available
  const isDebugAvailable = () => {
    return isDevelopment || (session?.user?.role === 'admin');
  };
  
  // Utility function to check if an image URL is valid
  const checkImageUrl = async (url: string) => {
    if (!url) return false;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking image URL:', error);
      return false;
    }
  };
  
  // Update debug info when relevant state changes
  useEffect(() => {
    if (status === 'authenticated') {
      setDebugInfo({
        sessionStatus: status,
        userId: session?.user?.id,
        userName: session?.user?.name,
        userEmail: session?.user?.email,
        userImage: session?.user?.image,
        userRole: session?.user?.role,
        processedImageUrl: getAvatarUrl(),
        avatarKey,
        uploadState: isUploading ? 'uploading' : (avatarFile ? 'file-selected' : 'idle'),
        sessionCheck: debugInfo.sessionCheck,
        schemaCheck: debugInfo.schemaCheck
      });
    }
  }, [status, session, avatarKey, isUploading, avatarFile]);
  
  // Add this function to make the user an admin
  const makeAdmin = async () => {
    try {
      console.log('Attempting to make user an admin using direct role update...');
      
      // Call the direct role update API
      const response = await fetch('/api/user/direct-role-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'admin'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role');
      }
      
      const data = await response.json();
      console.log('Direct role update response:', data);
      
      // Update the session with the new role
      await update({ role: 'admin' });
      
      alert('You are now an admin! Reloading page...');
      
      // Force a hard refresh of the page
      window.location.reload();
    } catch (error) {
      console.error('Error setting admin role:', error);
      alert('Error setting admin role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Add this function to refresh the session
  const refreshSession = async () => {
    try {
      console.log('Refreshing session...');
      await update();
      console.log('Session refreshed');
      alert('Session refreshed. Check the debug panel for updated information.');
    } catch (error) {
      console.error('Error refreshing session:', error);
      alert('Error refreshing session. See console for details.');
    }
  };
  
  // Add this function to check the session
  const checkSession = async () => {
    try {
      console.log('Checking session...');
      const response = await fetch('/api/user/check-session');
      const data = await response.json();
      console.log('Session check result:', data);
      
      // Update debug info with session check results
      setDebugInfo(prev => ({
        ...prev,
        sessionCheck: data
      }));
      
      // Show debug panel if not already visible
      if (!showDebug) {
        setShowDebug(true);
      }
      
      if (data.roleMatch === false) {
        alert('Session role does not match database role. Try refreshing the session.');
      }
    } catch (error) {
      console.error('Error checking session:', error);
      alert('Error checking session. See console for details.');
    }
  };
  
  // Update the forceCompleteRefresh function
  const forceCompleteRefresh = async () => {
    try {
      console.log('Forcing complete session refresh...');
      
      // Get the latest user data from the server
      const response = await fetch('/api/user/force-refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get user data');
      }
      
      const data = await response.json();
      console.log('Latest user data:', data);
      
      if (!data.user) {
        throw new Error('No user data returned from server');
      }
      
      // Create a new session object with the latest user data
      const updatedSession = {
        ...session,
        user: {
          ...session?.user,
          role: data.user.role,
          image: data.user.image
        }
      };
      
      console.log('Updating session with:', updatedSession);
      
      // Update the session
      await update(updatedSession);
      
      // Add a small delay to ensure the session is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if the session was updated correctly
      const checkResponse = await fetch('/api/user/check-session');
      const checkData = await checkResponse.json();
      console.log('Session check after update:', checkData);
      
      if (checkData.roleMatch) {
        alert('Session updated successfully! Role is now: ' + checkData.session.role);
        
        // Force a hard refresh of the page
        window.location.reload();
      } else {
        console.error('Session update failed. Session role and database role still don\'t match.');
        alert('Session update failed. Trying a more direct approach...');
        
        // Try a more direct approach - set the role directly
        await update({ role: data.user.role });
        
        // Force a hard refresh of the page
        window.location.href = window.location.href;
      }
    } catch (error) {
      console.error('Error forcing complete refresh:', error);
      alert('Error forcing complete refresh: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Add this function for direct role update
  const directRoleUpdate = async () => {
    try {
      console.log('Performing direct role update...');
      
      // First check the current session and database state
      const checkResponse = await fetch('/api/user/check-session');
      const checkData = await checkResponse.json();
      console.log('Current session state:', checkData);
      
      // Get the database role (or default to 'admin' if we're trying to become admin)
      const targetRole = checkData.databaseUser?.role || 'admin';
      console.log('Target role:', targetRole);
      
      // Call the direct role update API
      const response = await fetch('/api/user/direct-role-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: targetRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role');
      }
      
      const data = await response.json();
      console.log('Direct role update response:', data);
      
      // Update the session with the new role
      await update({ role: targetRole });
      
      alert(`Role directly updated to ${targetRole}. Reloading page...`);
      
      // Force a hard refresh of the page
      window.location.reload();
    } catch (error) {
      console.error('Error performing direct role update:', error);
      alert('Error performing direct role update: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Add this function to fix the role directly in the database
  const fixRoleInDatabase = async () => {
    try {
      console.log('Fixing role directly in database...');
      
      const response = await fetch('/api/user/fix-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fix role');
      }
      
      const data = await response.json();
      console.log('Fix role response:', data);
      
      alert(`Role fixed in database: ${data.user.role}. Please sign out and sign in again to refresh your session completely.`);
      
      // Offer to sign out
      if (confirm('Would you like to sign out now to refresh your session?')) {
        window.location.href = '/api/auth/signout';
      } else {
        // Try to update the session anyway
        await update({ role: 'admin' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fixing role in database:', error);
      alert('Error fixing role in database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Add this function to check the database schema
  const checkDatabaseSchema = async () => {
    try {
      console.log('Checking database schema...');
      
      const response = await fetch('/api/user/check-schema');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check schema');
      }
      
      const data = await response.json();
      console.log('Schema check response:', data);
      
      // Update debug info with schema check results
      setDebugInfo(prev => ({
        ...prev,
        schemaCheck: data
      }));
      
      // Show debug panel if not already visible
      if (!showDebug) {
        setShowDebug(true);
      }
      
      alert('Schema check completed. See debug panel for details.');
    } catch (error) {
      console.error('Error checking database schema:', error);
      alert('Error checking database schema: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Add this function for the comprehensive fix
  const completeFix = async () => {
    try {
      console.log('Applying comprehensive fix...');
      
      const response = await fetch('/api/user/complete-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to apply comprehensive fix');
      }
      
      const data = await response.json();
      console.log('Comprehensive fix response:', data);
      
      alert(`Role fixed using multiple methods: ${data.user.role}. Please sign out and sign in again for the changes to take full effect.`);
      
      // Try to update the session
      await update({ role: 'admin' });
      
      // Offer to sign out
      if (confirm('Would you like to sign out now to refresh your session completely?')) {
        window.location.href = '/api/auth/signout';
      } else {
        // Reload the page
        window.location.reload();
      }
    } catch (error) {
      console.error('Error applying comprehensive fix:', error);
      alert('Error applying comprehensive fix: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  // Add this function to check and fix the user's role
  const checkAndFixUserRole = async () => {
    if (!session?.user?.id) return;
    
    try {
      // First, check if the user has a role in the session
      if (!session.user.role) {
        console.log('No role found in session, attempting to fix...');
        
        // Call the API to check and fix the user's role
        const response = await fetch('/api/user/check-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Role check result:', data);
          
          if (data.updated) {
            alert(`Your role has been updated to: ${data.role}. Please refresh the page to see changes.`);
          } else {
            alert(`Your current role is: ${data.role}`);
          }
        } else {
          const error = await response.json();
          console.error('Failed to check/fix role:', error);
        }
      } else {
        alert(`Your current role is: ${session.user.role}`);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };
  
  // Render loading state
  if (status === 'loading') {
    return <LoadingComponent />
  }
  
  // Render authentication state
  if (status === 'unauthenticated') {
    return <AuthenticationComponent />
  }
  
  // Main component render
  return (
    <div className="profile-page">
      <Header />
      
      <div className="profile-container">
        <h1>Your Profile</h1>
        
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="avatar-container">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden-input"
                style={{ display: 'none' }}
              />
              
              {/* Avatar preview or current avatar */}
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Avatar Preview" 
                  className="profile-avatar" 
                />
              ) : session?.user?.image ? (
                <div className="avatar-wrapper">
                  <img 
                    src={getAvatarUrl()} 
                    alt={session.user.name || 'User'} 
                    className="profile-avatar"
                    key={`avatar-${avatarKey}`} // Force re-render when key changes
                    onError={(e) => {
                      console.error('Image failed to load:', getAvatarUrl());
                      e.currentTarget.src = '/default-avatar.png'; // Fallback image
                    }}
                  />
                  <button 
                    className="refresh-avatar-btn" 
                    onClick={forceRefreshAvatar}
                    title="Refresh avatar image"
                  >
                    <FontAwesomeIcon icon={faSync} />
                  </button>
                </div>
              ) : (
                <div className="default-avatar">
                  <FontAwesomeIcon icon={faUser} />
                </div>
              )}
              
              {/* Show upload button if a file is selected */}
              {avatarFile && !isUploading ? (
                <button 
                  className="upload-avatar-btn"
                  onClick={uploadAvatar}
                >
                  <FontAwesomeIcon icon={faUpload} /> Upload Avatar
                </button>
              ) : isUploading ? (
                <button className="uploading-btn" disabled>
                  <FontAwesomeIcon icon={faSpinner} spin /> Uploading...
                </button>
              ) : (
                <button 
                  className="change-avatar-btn"
                  onClick={handleAvatarClick}
                >
                  Change Avatar
                </button>
              )}
              
              {/* Show error message if upload fails */}
              {uploadError && (
                <div className="avatar-error">{uploadError}</div>
              )}
              
              {/* Debug toggle button */}
              {isDebugAvailable() && (
                <button 
                  onClick={toggleDebug} 
                  className="text-xs text-gray-500 mt-4 underline"
                >
                  {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
                </button>
              )}
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
            
            {/* Debug information panel */}
            {showDebug && (
              <div className="debug-panel">
                <h3>Debug Information</h3>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                
                <h4>Image Test</h4>
                <div>
                  <p>Direct image tag (no cache busting):</p>
                  <img 
                    src={session?.user?.image || ''} 
                    alt="Direct" 
                    className="debug-image"
                    onError={(e) => {
                      console.error('Direct image failed to load:', session?.user?.image);
                      e.currentTarget.style.border = '2px solid red';
                    }}
                  />
                </div>
                
                <div>
                  <p>Processed image URL (with cache busting):</p>
                  <img 
                    src={getAvatarUrl()} 
                    alt="Processed" 
                    className="debug-image"
                    onError={(e) => {
                      console.error('Processed image failed to load:', getAvatarUrl());
                      e.currentTarget.style.border = '2px solid red';
                    }}
                  />
                </div>
                
                <div>
                  <p>Try direct file path:</p>
                  <img 
                    src={session?.user?.image?.split('?')[0]} 
                    alt="No Query" 
                    className="debug-image"
                    onError={(e) => {
                      console.error('No query image failed to load:', session?.user?.image?.split('?')[0]);
                      e.currentTarget.style.border = '2px solid red';
                    }}
                  />
                </div>
                
                <div>
                  <p>Try absolute URL:</p>
                  <img 
                    src={`${window.location.origin}${session?.user?.image?.startsWith('/') ? session?.user?.image : `/${session?.user?.image}`}`} 
                    alt="Absolute" 
                    className="debug-image"
                    onError={(e) => {
                      const url = `${window.location.origin}${session?.user?.image?.startsWith('/') ? session?.user?.image : `/${session?.user?.image}`}`;
                      console.error('Absolute URL image failed to load:', url);
                      e.currentTarget.style.border = '2px solid red';
                    }}
                  />
                </div>
                
                <button 
                  className="debug-btn"
                  onClick={async () => {
                    console.log('Current session:', session);
                    console.log('Avatar URL:', getAvatarUrl());
                    
                    // Check if the image URLs are valid
                    if (session?.user?.image) {
                      const directValid = await checkImageUrl(session.user.image);
                      console.log('Direct image URL valid:', directValid);
                      
                      const processedValid = await checkImageUrl(getAvatarUrl());
                      console.log('Processed image URL valid:', processedValid);
                      
                      const noQueryValid = await checkImageUrl(session.user.image.split('?')[0]);
                      console.log('No query image URL valid:', noQueryValid);
                      
                      const absoluteUrl = `${window.location.origin}${session.user.image.startsWith('/') ? session.user.image : `/${session.user.image}`}`;
                      const absoluteValid = await checkImageUrl(absoluteUrl);
                      console.log('Absolute URL valid:', absoluteValid);
                    }
                    
                    // Force session refresh
                    await update();
                  }}
                >
                  Log Debug Info & Check URLs
                </button>
                
                <button 
                  className="debug-btn"
                  onClick={async () => {
                    // Try to fix the image URL
                    if (session?.user?.image) {
                      let fixedUrl = session.user.image;
                      
                      // If it's a relative URL but doesn't start with a slash, add one
                      if (!fixedUrl.startsWith('/') && !fixedUrl.startsWith('http')) {
                        fixedUrl = `/${fixedUrl}`;
                      }
                      
                      // If it's a Dicebear URL, replace it with the latest uploaded avatar
                      if (fixedUrl.includes('dicebear')) {
                        // Get the latest avatar from the server
                        try {
                          const response = await fetch('/api/user/latest-avatar');
                          if (response.ok) {
                            const data = await response.json();
                            if (data.imageUrl) {
                              fixedUrl = data.imageUrl;
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching latest avatar:', error);
                        }
                      }
                      
                      console.log('Attempting to fix image URL:');
                      console.log('- Original:', session.user.image);
                      console.log('- Fixed:', fixedUrl);
                      
                      // Update the session with the fixed URL
                      await update({ image: fixedUrl });
                    }
                  }}
                >
                  Try to Fix Image URL
                </button>
                
                {/* Add this button near the debug button */}
                {isDevelopment && (
                  <button 
                    onClick={makeAdmin} 
                    className="text-xs text-blue-500 mt-2 underline"
                  >
                    Make Me Admin
                  </button>
                )}
                
                {/* Add this button near the debug button */}
                {isDebugAvailable() && (
                  <button 
                    onClick={refreshSession} 
                    className="text-xs text-blue-500 mt-2 ml-4 underline"
                  >
                    Refresh Session
                  </button>
                )}
                
                {/* Add this button near the other debug buttons */}
                {isDebugAvailable() && (
                  <button 
                    onClick={checkSession} 
                    className="text-xs text-green-500 mt-2 ml-4 underline"
                  >
                    Check Session
                  </button>
                )}
                
                {/* Add this button near the other debug buttons */}
                {isDebugAvailable() && (
                  <button 
                    onClick={forceCompleteRefresh} 
                    className="text-xs text-purple-500 mt-2 ml-4 underline"
                  >
                    Force Complete Refresh
                  </button>
                )}
                
                {/* Add this button near the other debug buttons */}
                {isDebugAvailable() && (
                  <button 
                    onClick={directRoleUpdate} 
                    className="text-xs text-red-500 mt-2 ml-4 underline"
                  >
                    Direct Role Update
                  </button>
                )}
                
                {/* Add this button near the other debug buttons */}
                {isDebugAvailable() && (
                  <button 
                    onClick={fixRoleInDatabase} 
                    className="text-xs text-orange-500 mt-2 ml-4 underline"
                  >
                    Fix Role in Database
                  </button>
                )}
                
                {/* Add this button near the other debug buttons */}
                {isDebugAvailable() && (
                  <button 
                    onClick={checkDatabaseSchema} 
                    className="text-xs text-teal-500 mt-2 ml-4 underline"
                  >
                    Check DB Schema
                  </button>
                )}
                
                {/* Add this button near the other debug buttons */}
                {isDebugAvailable() && (
                  <button 
                    onClick={completeFix} 
                    className="text-xs text-pink-500 mt-2 ml-4 font-bold underline"
                  >
                    COMPLETE FIX
                  </button>
                )}
                
                {/* Add this button to the debug panel */}
                {isDevelopment && (
                  <button 
                    onClick={checkAndFixUserRole} 
                    className="text-xs text-green-500 mt-2 underline"
                  >
                    Check/Fix User Role
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-role">
          <h3>Account Type</h3>
          <div className={`role-badge role-${session?.user?.role || 'user'}`}>
            {session?.user?.role || 'user'}
          </div>
          
          {session?.user?.role === 'admin' && (
            <div className="admin-link-container">
              <Link href="/admin" className="admin-link">
                <FontAwesomeIcon icon={faUserShield} className="admin-icon" />
                Admin Dashboard
              </Link>
            </div>
          )}
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
          padding-top: 80px; /* Same as header height to prevent content from being hidden */
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
        
        .avatar-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }
        
        .refresh-avatar-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s;
        }
        
        .refresh-avatar-btn:hover {
          transform: rotate(180deg);
        }
        
        .profile-avatar {
          width: 150px;
          height: 150px;
          border-radius: 50%;
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
        
        .change-avatar-btn, .upload-avatar-btn, .uploading-btn {
          background-color: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .change-avatar-btn:hover, .upload-avatar-btn:hover {
          background-color: var(--primary-color);
          color: white;
        }
        
        .upload-avatar-btn {
          background-color: var(--primary-color);
          color: white;
          margin-top: 0.5rem;
        }
        
        .uploading-btn {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .avatar-error {
          color: #ff4444;
          margin-top: 0.5rem;
          font-size: 0.85rem;
          text-align: center;
        }
        
        .debug-toggle-btn {
          margin-top: 1rem;
          background-color: #333;
          color: #aaa;
          border: 1px solid #555;
          padding: 0.3rem 0.6rem;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        
        .debug-toggle-btn:hover {
          background-color: #444;
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
          opacity: 0.7;
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
        }
        
        .save-button:hover {
          background-color: var(--hover-color);
        }
        
        .debug-panel {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #1a1a1a;
          border: 1px solid #333;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
        }
        
        .debug-panel h3 {
          margin-top: 0;
          color: #aaa;
        }
        
        .debug-panel pre {
          background-color: #111;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          color: #ddd;
        }
        
        .debug-panel h4 {
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: #aaa;
        }
        
        .debug-image {
          max-width: 100px;
          max-height: 100px;
          border: 1px solid #444;
          margin: 0.5rem 0;
          background-color: #222;
        }
        
        .debug-btn {
          margin-top: 1rem;
          background-color: #333;
          color: #aaa;
          border: 1px solid #555;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
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
          }
        }
        
        .profile-role {
          background-color: var(--card-bg);
          border-radius: 8px;
          padding: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .profile-role h3 {
          margin-bottom: 1rem;
          font-size: 1.2rem;
        }
        
        .role-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
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
        
        .admin-link-container {
          margin-top: 1.5rem;
        }
        
        .admin-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background-color: var(--badge-admin-bg, #7c3aed);
          color: white;
          border-radius: 4px;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .admin-link:hover {
          background-color: #6d28d9;
        }
        
        .admin-icon {
          font-size: 1rem;
        }
      `}</style>
    </div>
  )
}