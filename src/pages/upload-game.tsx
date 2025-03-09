import { useState, useRef, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '../components/Header'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faFile, faGamepad, faSpinner } from '@fortawesome/free-solid-svg-icons'
import { getErrorMessage } from '../utils/errorHandling'

export default function UploadGame() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Action')
  const [gameType, setGameType] = useState('html5')
  const [mainFile, setMainFile] = useState<File | null>(null)
  const [assetFiles, setAssetFiles] = useState<File[]>([])
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [zipFile, setZipFile] = useState<File | null>(null)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="loading-container">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading...</p>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!title || !description || !category || !gameType) {
      setError('Please fill in all required fields')
      return
    }
    
    if (!mainFile && !zipFile) {
      setError('Please upload a main file or a zip file')
      return
    }
    
    setIsUploading(true)
    setError('')
    
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('category', category)
      formData.append('gameType', gameType)
      
      if (mainFile) {
        formData.append('mainFile', mainFile)
      }
      
      if (zipFile) {
        formData.append('zipFile', zipFile)
      }
      
      // Add asset files
      assetFiles.forEach((file, index) => {
        formData.append(`assetFile_${index}`, file)
      })
      
      // Add thumbnail
      if (thumbnailFile) {
        formData.append('thumbnailFile', thumbnailFile)
      }
      
      const response = await fetch('/api/games/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload game')
      }
      
      // Redirect to the game page
      router.push(`/game/${data.game.id}`)
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'Failed to upload game. Please try again.'))
      setIsUploading(false)
    }
  }

  const handleMainFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setMainFile(e.target.files[0]);
    }
  };

  const handleThumbnailChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleAssetFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // Convert FileList to array
      const filesArray = Array.from(e.target.files);
      setAssetFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleZipFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setZipFile(e.target.files[0]);
    }
  };

  const removeAssetFile = (index: number) => {
    setAssetFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-game-container">
      <Header />
      
      <div className="content">
        <h1>Upload Game</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-section">
            <h2>Game Details</h2>
            
            <div className="form-group">
              <label htmlFor="title">Title*</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description*</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={500}
                rows={4}
              ></textarea>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select 
                  id="category" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  <option value="Action">Action</option>
                  <option value="Adventure">Adventure</option>
                  <option value="Arcade">Arcade</option>
                  <option value="Puzzle">Puzzle</option>
                  <option value="RPG">RPG</option>
                  <option value="Simulation">Simulation</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="gameType">Game Type*</label>
                <select 
                  id="gameType" 
                  value={gameType} 
                  onChange={(e) => setGameType(e.target.value)}
                  required
                >
                  <option value="webgl">WebGL</option>
                  <option value="html5">HTML5</option>
                  <option value="javascript">JavaScript</option>
                  <option value="unity">Unity WebGL</option>
                  <option value="phaser">Phaser.js</option>
                  <option value="text">Text Adventure</option>
                  <option value="pixel">Pixel Art</option>
                  <option value="wasm">WebAssembly</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h2>Game Files</h2>
            
            <div className="form-group">
              <label htmlFor="mainFile">Main Game File*</label>
              <div className="file-input">
                <input 
                  type="file" 
                  id="mainFile" 
                  onChange={handleMainFileChange}
                  className="hidden-input"
                />
                <label htmlFor="mainFile" className="file-button">
                  <FontAwesomeIcon icon={faFile} /> Select Main File
                </label>
                {mainFile && <span className="file-name">{mainFile.name}</span>}
              </div>
              <div className="input-hint">
                This is the main entry point for your game (e.g., index.html, game.js)
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="assetFiles">Asset Files</label>
              <div className="file-input">
                <input 
                  type="file" 
                  id="assetFiles" 
                  onChange={handleAssetFilesChange}
                  multiple
                  className="hidden-input"
                />
                <label htmlFor="assetFiles" className="file-button">
                  <FontAwesomeIcon icon={faUpload} /> Select Asset Files
                </label>
                {assetFiles.length > 0 && (
                  <span className="file-name">{assetFiles.length} files selected</span>
                )}
              </div>
              <div className="input-hint">
                Additional files your game needs (images, audio, etc.)
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="thumbnailFile">Thumbnail Image</label>
              <div className="file-input">
                <input 
                  type="file" 
                  id="thumbnailFile" 
                  onChange={handleThumbnailChange}
                  accept="image/*"
                  className="hidden-input"
                />
                <label htmlFor="thumbnailFile" className="file-button">
                  <FontAwesomeIcon icon={faFile} /> Select Thumbnail
                </label>
                {thumbnailFile && <span className="file-name">{thumbnailFile.name}</span>}
              </div>
              <div className="input-hint">
                A preview image for your game. Recommended size: 400x225px
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="cancel-button"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="upload-button"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Uploading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faGamepad} /> Upload Game
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .upload-game-container {
          min-height: 100vh;
          background-color: var(--background-dark);
          color: var(--text-color);
        }
        
        .content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          padding-top: 80px; /* Same as header height to prevent content from being hidden */
        }
        
        h1 {
          margin-bottom: 2rem;
          font-size: 2rem;
          color: var(--text-color);
        }
        
        .error-message, .success-message {
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }
        
        .error-message {
          background-color: rgba(255, 0, 0, 0.1);
          border-left: 4px solid #ff4444;
          color: #ff4444;
        }
        
        .success-message {
          background-color: rgba(76, 175, 80, 0.1);
          border-left: 4px solid #4CAF50;
          color: #4CAF50;
        }
        
        .upload-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        
        .form-section {
          background-color: var(--card-bg);
          border-radius: 10px;
          padding: 1.5rem;
        }
        
        .form-section h2 {
          font-size: 1.3rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .form-group {
          margin-bottom: 1.2rem;
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
        
        input, textarea, select {
          width: 100%;
          padding: 0.8rem 1rem;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          color: var(--text-color);
          font-size: 1rem;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        
        .hidden-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .file-input {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .file-button {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.7rem 1.2rem;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .file-button:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .file-name {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }
        
        .input-hint {
          margin-top: 0.5rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .cancel-button, .upload-button {
          padding: 0.8rem 1.5rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          transition: all 0.3s;
        }
        
        .cancel-button {
          background-color: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: var(--text-color);
        }
        
        .cancel-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .upload-button {
          background-color: var(--primary-color);
          color: white;
        }
        
        .upload-button:hover {
          background-color: var(--hover-color);
        }
        
        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
} 