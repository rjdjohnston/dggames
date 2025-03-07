import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '../../components/Header'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faArrowLeft, faSave, faTrash, 
  faSpinner, faUpload, faExclamationTriangle, faFileCode, faTimesCircle 
} from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

interface Author {
  id: string
  name: string
  image: string
}

interface GameData {
  id: string
  title: string
  description: string
  content: string
  category: string
  image: string
  likes: number
  plays: number
  gameType: string
  files: {
    mainFile: string
    assetFiles: string[]
  }
  settings: {
    width: number
    height: number
    fullscreen: boolean
  }
  author: Author
  createdAt: string
}

interface FormErrors {
  title?: string
  description?: string
  category?: string
  gameType?: string
  file?: string
  image?: string
}

export default function EditGame() {
  const router = useRouter()
  const { id } = router.query
  const { data: session, status } = useSession()
  const [game, setGame] = useState<GameData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [gameType, setGameType] = useState('')
  const [gameFile, setGameFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState('')
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)
  const [fullscreen, setFullscreen] = useState(false)
  const [removeGameFile, setRemoveGameFile] = useState(false)
  const [removeImageFile, setRemoveImageFile] = useState(false)
  const [assetFiles, setAssetFiles] = useState<string[]>([])
  const [removeAssetFiles, setRemoveAssetFiles] = useState<string[]>([])
  const [newAssetFiles, setNewAssetFiles] = useState<File[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const assetFilesInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch game data
  useEffect(() => {
    if (!id || status !== 'authenticated') return
    
    fetch(`/api/games/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch game')
        return response.json()
      })
      .then(data => {
        console.log('Game data received:', data)
        setGame(data)
        
        // Initialize form values
        setTitle(data.title || '')
        setDescription(data.description || '')
        
        // Handle category with normalization
        const rawCategory = data.category || ''
        console.log('Raw category value:', rawCategory)
        
        // Normalize category (trim, lowercase) to match select options
        let normalizedCategory = typeof rawCategory === 'string' 
          ? rawCategory.trim().toLowerCase() 
          : ''
          
        // If category is capitalized or has different format, ensure it matches an option
        const validCategories = ['action', 'adventure', 'puzzle', 'strategy', 'rpg', 
                              'simulation', 'sports', 'casual', 'other']
        
        if (!validCategories.includes(normalizedCategory)) {
          // Try to find the closest match
          for (const validCategory of validCategories) {
            if (normalizedCategory.includes(validCategory) || 
                validCategory.includes(normalizedCategory)) {
              normalizedCategory = validCategory
              break
            }
          }
          
          // If still no match, default to 'other'
          if (!validCategories.includes(normalizedCategory)) {
            normalizedCategory = 'other'
          }
        }
        
        console.log('Normalized category:', normalizedCategory)
        setCategory(normalizedCategory)
        
        setGameType(data.gameType || '')
        setPreviewImage(data.image || '')
        
        // Load asset files if they exist
        if (data.files && data.files.assetFiles && Array.isArray(data.files.assetFiles)) {
          console.log('Asset files found:', data.files.assetFiles)
          setAssetFiles(data.files.assetFiles)
        } else {
          console.log('No asset files found')
          setAssetFiles([])
        }
        
        if (data.settings) {
          setWidth(data.settings.width || 800)
          setHeight(data.settings.height || 600)
          setFullscreen(data.settings.fullscreen || false)
        }
        
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setError('Unable to load game. Please try again later.')
        setIsLoading(false)
      })
  }, [id, status])

  // Check if current user is the author
  useEffect(() => {
    if (game && session && game.author.id) {
      // @ts-ignore - id may exist on session.user
      const currentUserId = session.user?.id
      
      if (game.author.id !== currentUserId) {
        // Not the author, redirect to game page
        router.push(`/game/${id}`)
      }
    }
  }, [game, session, router, id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFormErrors({...formErrors, image: 'Please upload an image file'})
      return
    }

    setImageFile(file)
    
    // Show preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    // Clear any previous errors
    if (formErrors.image) {
      const { image, ...rest } = formErrors
      setFormErrors(rest)
    }
  }

  const handleGameFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type based on game type
    let isValid = false
    
    switch (gameType) {
      case 'html5':
        isValid = file.type === 'text/html' || file.name.endsWith('.html')
        break
      case 'unity':
        isValid = file.name.endsWith('.unity3d') || file.type === 'application/octet-stream'
        break
      case 'flash':
        isValid = file.name.endsWith('.swf') || file.type === 'application/x-shockwave-flash'
        break
      default:
        isValid = true
    }

    if (!isValid) {
      setFormErrors({...formErrors, file: 'Please upload a valid game file for the selected game type'})
      return
    }

    setGameFile(file)
    
    // Clear any previous errors
    if (formErrors.file) {
      const { file, ...rest } = formErrors
      setFormErrors(rest)
    }
  }

  const handleAssetFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Convert FileList to array and add to newAssetFiles
    const filesArray = Array.from(e.target.files);
    setNewAssetFiles(prev => [...prev, ...filesArray]);
    
    // Reset the input to allow selecting the same file again
    if (assetFilesInputRef.current) {
      assetFilesInputRef.current.value = '';
    }
  };
  
  const handleRemoveNewAssetFile = (index: number) => {
    setNewAssetFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemoveExistingAssetFile = (filePath: string) => {
    setRemoveAssetFiles(prev => [...prev, filePath]);
  };
  
  const handleUndoRemoveAssetFile = (filePath: string) => {
    setRemoveAssetFiles(prev => prev.filter(path => path !== filePath));
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    
    if (!title.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!description.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!category) {
      errors.category = 'Category is required'
    } else {
      console.log('Category validated:', category)
    }
    
    if (!gameType) {
      errors.gameType = 'Game type is required'
    }
    
    // Only validate files if they've been selected (since they're optional on edit)
    if (gameFile && gameType === 'html5' && !gameFile.name.endsWith('.html')) {
      errors.file = 'HTML5 games require an HTML file'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if user is authenticated
    if (!session) {
      setError('You must be logged in to update a game. Please sign in and try again.');
      return;
    }
    
    console.log('Session data:', session);
    setIsSaving(true);
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('id', id as string);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('gameType', gameType);
      
      // Optional files
      if (gameFile) {
        formData.append('gameFile', gameFile);
        console.log('Attaching game file:', gameFile.name);
      }
      
      if (imageFile) {
        formData.append('image', imageFile);
        console.log('Attaching image file:', imageFile.name);
      }
      
      // Add new asset files
      if (newAssetFiles.length > 0) {
        newAssetFiles.forEach((file, index) => {
          formData.append(`assetFile_${index}`, file);
          console.log(`Attaching asset file ${index}:`, file.name);
        });
        formData.append('assetFilesCount', newAssetFiles.length.toString());
      }
      
      // Add asset files to remove
      if (removeAssetFiles.length > 0) {
        formData.append('removeAssetFiles', JSON.stringify(removeAssetFiles));
        console.log('Asset files to remove:', removeAssetFiles);
      }
      
      // Game settings
      formData.append('settings', JSON.stringify({
        width,
        height,
        fullscreen
      }));
      
      // Indicate if files should be removed
      formData.append('removeGameFile', removeGameFile.toString());
      formData.append('removeImageFile', removeImageFile.toString());
      
      console.log('File removal flags:', {
        removeGameFile,
        removeImageFile,
        removeAssetFiles
      });
      
      // Send the update request with explicit headers
      console.log('Sending PUT request to:', `/api/games/${id}`);
      const response = await fetch(`/api/games/${id}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Error: ${response.status} - ${response.statusText}`;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            console.log('Error data:', errorData);
            errorMessage = errorData.message || errorMessage;
          } else {
            const textError = await response.text();
            console.log('Error text:', textError);
            if (textError) errorMessage += ` - ${textError}`;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log('Update successful:', responseData);
      
      // Show success message before redirecting
      setError('');
      alert('Game updated successfully!');
      
      // Redirect to the game detail page
      router.push(`/game/${id}`);
      
    } catch (error) {
      console.error('Error updating game:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  }

  const handleDelete = async () => {
    if (!id) return
    
    // Check if user is authenticated
    if (!session) {
      setError('You must be logged in to delete a game. Please sign in and try again.')
      setDeleteModalOpen(false)
      return
    }
    
    try {
      console.log('Sending DELETE request to:', `/api/games/${id}`)
      const response = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
      
      console.log('Delete response status:', response.status)
      
      if (!response.ok) {
        let errorMessage = `Error: ${response.status} - ${response.statusText}`
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } else {
            const textError = await response.text()
            if (textError) errorMessage += ` - ${textError}`
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }
        
        throw new Error(errorMessage)
      }
      
      // Redirect to my games on success
      router.push('/my-games')
      
    } catch (error) {
      console.error('Error deleting game:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete game. Please try again.')
      setDeleteModalOpen(false)
    }
  }

  const resetImageInput = () => {
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
    setImageFile(null)
  }

  const resetGameFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setGameFile(null)
  }

  const handleRemoveImage = () => {
    resetImageInput();
    setPreviewImage('');
    setRemoveImageFile(true);
    console.log('Image marked for removal');
  }

  const handleRemoveGameFile = () => {
    resetGameFileInput();
    setRemoveGameFile(true);
    // Don't set game to null as that removes all game data
    console.log('Game file marked for removal');
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="container">
        <Header />
        <div className="loading-container">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <Header />
        <div className="error-container">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
          <p>{error}</p>
          <button onClick={() => router.back()} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header />
      
      <main className="edit-container">
        <div className="page-header">
          <button onClick={() => router.back()} className="back-button">
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <h1>Edit Game</h1>
          <button 
            onClick={() => setDeleteModalOpen(true)} 
            className="delete-button"
            aria-label="Delete game"
          >
            <FontAwesomeIcon icon={faTrash} /> Delete
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-grid">
            <div className="form-main">
              <div className="form-group">
                <label htmlFor="title">Title*</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={formErrors.title ? 'error' : ''}
                />
                {formErrors.title && <div className="error-message">{formErrors.title}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description*</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                  className={formErrors.description ? 'error' : ''}
                ></textarea>
                {formErrors.description && <div className="error-message">{formErrors.description}</div>}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category">Category*</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => {
                      console.log('Category changed to:', e.target.value)
                      setCategory(e.target.value)
                    }}
                    required
                    className={formErrors.category ? 'error' : ''}
                  >
                    <option value="">Select a category</option>
                    <option value="action">Action</option>
                    <option value="adventure">Adventure</option>
                    <option value="puzzle">Puzzle</option>
                    <option value="strategy">Strategy</option>
                    <option value="rpg">RPG</option>
                    <option value="simulation">Simulation</option>
                    <option value="sports">Sports</option>
                    <option value="casual">Casual</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.category && <div className="error-message">{formErrors.category}</div>}
                  {/* Debug indicator */}
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    Current value: {category || 'none'}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="gameType">Game Type*</label>
                  <select
                    id="gameType"
                    value={gameType}
                    onChange={(e) => setGameType(e.target.value)}
                    required
                    className={formErrors.gameType ? 'error' : ''}
                  >
                    <option value="">Select a game type</option>
                    <option value="html5">HTML5</option>
                    <option value="unity">Unity WebGL</option>
                    <option value="flash">Flash</option>
                    <option value="text">Text Adventure</option>
                    <option value="other">Other</option>
                  </select>
                  {formErrors.gameType && <div className="error-message">{formErrors.gameType}</div>}
                </div>
              </div>
              
              <div className="form-group">
                <label>Main Game File</label>
                <div className="file-upload">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleGameFileChange}
                    className={formErrors.file ? 'error' : ''}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="file-button"
                    disabled={removeGameFile}
                  >
                    <FontAwesomeIcon icon={faUpload} /> Choose File
                  </button>
                  <span className="file-name">
                    {gameFile ? gameFile.name : 
                      (game?.files?.mainFile && !removeGameFile) ? 'Current file will be kept' : 
                      (removeGameFile ? 'File will be removed' : 'No file chosen')}
                  </span>
                  
                  {/* Add remove button when there's a file to remove */}
                  {(gameFile || game?.files?.mainFile) && !removeGameFile && (
                    <button 
                      type="button" 
                      className="remove-file-button"
                      onClick={handleRemoveGameFile}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Remove
                    </button>
                  )}
                </div>
                {removeGameFile && (
                  <div className="file-removal-note">
                    <FontAwesomeIcon icon={faTrash} /> Game file will be removed
                    <button 
                      type="button" 
                      className="undo-button"
                      onClick={() => setRemoveGameFile(false)}
                    >
                      Undo
                    </button>
                  </div>
                )}
                {formErrors.file && <div className="error-message">{formErrors.file}</div>}
                
                {/* Show current file info if exists */}
                {game?.files?.mainFile && !removeGameFile && !gameFile && (
                  <div className="current-file-info">
                    <FontAwesomeIcon icon={faFileCode} /> Current file: 
                    <span className="file-path">{game.files.mainFile}</span>
                  </div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="width">Game Width (px)</label>
                  <input
                    type="number"
                    id="width"
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                    min="100"
                    max="2000"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="height">Game Height (px)</label>
                  <input
                    type="number"
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 600)}
                    min="100"
                    max="2000"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={fullscreen}
                    onChange={(e) => setFullscreen(e.target.checked)}
                  />
                  Allow Fullscreen Mode
                </label>
              </div>

              <div className="form-group">
                <label>Additional Asset Files</label>
                <div className="asset-files-container">
                  {/* Display existing asset files */}
                  {assetFiles.length > 0 && (
                    <div className="existing-assets">
                      <h4>Current Asset Files:</h4>
                      <ul className="asset-files-list">
                        {assetFiles.map((filePath, index) => {
                          const fileName = filePath.split('/').pop() || filePath;
                          const isMarkedForRemoval = removeAssetFiles.includes(filePath);
                          
                          return (
                            <li key={`asset-${index}`} className={isMarkedForRemoval ? 'marked-for-removal' : ''}>
                              <div className="asset-file-item">
                                <FontAwesomeIcon icon={faFileCode} />
                                <span className="asset-file-name" title={filePath}>
                                  {fileName}
                                </span>
                                
                                {isMarkedForRemoval ? (
                                  <button 
                                    type="button" 
                                    className="undo-button small"
                                    onClick={() => handleUndoRemoveAssetFile(filePath)}
                                  >
                                    Undo Remove
                                  </button>
                                ) : (
                                  <button 
                                    type="button" 
                                    className="remove-file-button small"
                                    onClick={() => handleRemoveExistingAssetFile(filePath)}
                                  >
                                    <FontAwesomeIcon icon={faTimesCircle} />
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                  
                  {/* Display newly added asset files */}
                  {newAssetFiles.length > 0 && (
                    <div className="new-assets">
                      <h4>New Asset Files:</h4>
                      <ul className="asset-files-list">
                        {newAssetFiles.map((file, index) => (
                          <li key={`new-asset-${index}`}>
                            <div className="asset-file-item">
                              <FontAwesomeIcon icon={faFileCode} />
                              <span className="asset-file-name" title={file.name}>
                                {file.name}
                              </span>
                              <button 
                                type="button" 
                                className="remove-file-button small"
                                onClick={() => handleRemoveNewAssetFile(index)}
                              >
                                <FontAwesomeIcon icon={faTimesCircle} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Add new asset files button */}
                  <div className="add-asset-files">
                    <input
                      type="file"
                      multiple
                      ref={assetFilesInputRef}
                      onChange={handleAssetFilesChange}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => assetFilesInputRef.current?.click()}
                      className="file-button secondary"
                    >
                      <FontAwesomeIcon icon={faUpload} /> Add Asset Files
                    </button>
                    <span className="hint-text">
                      Add additional files needed by your game (images, scripts, etc.)
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-sidebar">
              <div className="form-group">
                <label>Game Thumbnail</label>
                <div className="image-preview">
                  {previewImage && !removeImageFile ? (
                    <img src={previewImage} alt="Game thumbnail preview" />
                  ) : (
                    <div className="empty-preview">No image selected</div>
                  )}
                </div>
                <div className="file-upload">
                  <input
                    type="file"
                    accept="image/*"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    className={formErrors.image ? 'error' : ''}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="file-button"
                    disabled={removeImageFile}
                  >
                    <FontAwesomeIcon icon={faUpload} /> Choose Image
                  </button>
                  <span className="file-name">
                    {imageFile ? imageFile.name : 
                      (game?.image && !removeImageFile) ? 'Current image will be kept' : 
                      (removeImageFile ? 'Image will be removed' : 'No image chosen')}
                  </span>
                  
                  {/* Add remove button for image */}
                  {(imageFile || (game?.image && !removeImageFile)) && (
                    <button 
                      type="button" 
                      className="remove-file-button"
                      onClick={handleRemoveImage}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Remove
                    </button>
                  )}
                </div>
                {removeImageFile && (
                  <div className="file-removal-note">
                    <FontAwesomeIcon icon={faTrash} /> Image will be removed
                    <button 
                      type="button" 
                      className="undo-button"
                      onClick={() => {
                        setRemoveImageFile(false);
                        if (game?.image) setPreviewImage(game.image);
                      }}
                    >
                      Undo
                    </button>
                  </div>
                )}
                {formErrors.image && <div className="error-message">{formErrors.image}</div>}
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin /> Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} /> Save Changes
                    </>
                  )}
                </button>
                
                <Link href={`/play/${id}`} className="preview-link">
                  Preview Game
                </Link>
              </div>
            </div>
          </div>
        </form>
        
        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Delete Game</h3>
              <p>Are you sure you want to delete this game? This action cannot be undone.</p>
              <div className="modal-actions">
                <button onClick={() => setDeleteModalOpen(false)} className="cancel-button">
                  Cancel
                </button>
                <button onClick={handleDelete} className="delete-button">
                  Delete Game
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <style jsx>{`
        .container {
          min-height: 100vh;
          background-color: var(--background-dark);
          color: var(--text-color);
        }
        
        .edit-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        h1 {
          font-size: 2rem;
          margin: 0;
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--text-color);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .back-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .delete-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background-color: transparent;
          border: 1px solid #f44336;
          color: #f44336;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .delete-button:hover {
          background-color: #f44336;
          color: white;
        }
        
        .edit-form {
          background-color: var(--card-bg);
          border-radius: 8px;
          overflow: hidden;
          padding: 2rem;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        
        input[type="text"],
        input[type="number"],
        textarea,
        select {
          width: 100%;
          padding: 0.75rem;
          background-color: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          color: white;
          font-size: 1rem;
        }
        
        input[type="text"]:focus,
        input[type="number"]:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        
        input.error,
        textarea.error,
        select.error {
          border-color: #f44336;
        }
        
        .error-message {
          color: #f44336;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .file-upload {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        
        .file-button {
          background-color: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.3s;
          white-space: nowrap;
        }
        
        .file-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .file-name {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .remove-file-button {
          background-color: rgba(244, 67, 54, 0.1);
          border: 1px solid rgba(244, 67, 54, 0.3);
          color: #f44336;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
          white-space: nowrap;
        }
        
        .remove-file-button:hover {
          background-color: rgba(244, 67, 54, 0.2);
        }
        
        .file-removal-note {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #f44336;
          font-size: 0.9rem;
          padding: 0.5rem;
          background-color: rgba(244, 67, 54, 0.05);
          border-radius: 4px;
        }
        
        .undo-button {
          background: none;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          margin-left: auto;
          font-weight: 500;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background-color 0.3s;
        }
        
        .undo-button:hover {
          background-color: rgba(114, 137, 218, 0.1);
        }
        
        .current-file-info {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          padding: 0.5rem;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .file-path {
          margin-left: 0.5rem;
          word-break: break-all;
          font-family: monospace;
          font-size: 0.85rem;
        }
        
        .image-preview {
          width: 100%;
          height: 200px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .empty-preview {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.9rem;
        }
        
        .form-actions {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .submit-button {
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 1rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
        }
        
        .submit-button:hover:not(:disabled) {
          background-color: var(--hover-color);
        }
        
        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .preview-link {
          text-align: center;
          color: var(--primary-color);
          text-decoration: none;
          padding: 0.75rem;
          border: 1px solid var(--primary-color);
          border-radius: 4px;
          transition: all 0.3s;
        }
        
        .preview-link:hover {
          background-color: rgba(114, 137, 218, 0.1);
        }
        
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
          text-align: center;
          padding: 2rem;
        }
        
        .error-container {
          color: #f44336;
        }
        
        .error-container button {
          margin-top: 1rem;
        }
        
        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        
        .modal-content {
          background-color: var(--card-bg);
          border-radius: 8px;
          padding: 1.5rem;
          width: 90%;
          max-width: 400px;
        }
        
        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 1rem;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1.5rem;
        }
        
        .cancel-button, .delete-button {
          padding: 0.6rem 1rem;
          border-radius: 4px;
          border: none;
          font-weight: 500;
          cursor: pointer;
        }
        
        .cancel-button {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-color);
        }
        
        .delete-button {
          background-color: #f44336;
          color: white;
        }
        
        .cancel-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .delete-button:hover {
          background-color: #d32f2f;
        }
        
        .asset-files-container {
          margin-top: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          padding: 1rem;
          background-color: rgba(0, 0, 0, 0.2);
        }
        
        .asset-files-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem 0;
        }
        
        .asset-file-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          gap: 0.5rem;
        }
        
        .asset-file-name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.9rem;
        }
        
        .remove-file-button.small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
        }
        
        .undo-button.small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          color: var(--primary-color);
          background-color: rgba(114, 137, 218, 0.1);
        }
        
        .add-asset-files {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.5rem;
        }
        
        .hint-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .file-button.secondary {
          background-color: rgba(114, 137, 218, 0.1);
          border: 1px solid rgba(114, 137, 218, 0.3);
        }
        
        .file-button.secondary:hover {
          background-color: rgba(114, 137, 218, 0.2);
        }
        
        .marked-for-removal .asset-file-item {
          opacity: 0.6;
          border: 1px dashed rgba(244, 67, 54, 0.5);
        }
        
        .marked-for-removal .asset-file-name {
          text-decoration: line-through;
          color: rgba(255, 255, 255, 0.5);
        }
        
        h4 {
          font-size: 0.9rem;
          margin: 0.5rem 0;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }
        
        .existing-assets, .new-assets {
          margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .page-header {
            flex-wrap: wrap;
            gap: 1rem;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
} 