import { NextApiRequest, NextApiResponse } from 'next';
// import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react'
// import { authOptions } from '../auth/[...nextauth]';
import { MongoClient, ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { remove } from 'fs-extra';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

// Configure Next.js to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// MongoDB connection details
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'dggames';

// File storage paths
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');
const GAME_FILES_BASE_DIR = path.join(UPLOADS_DIR, 'games');

// Ensure uploads directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(GAME_FILES_BASE_DIR)) {
  fs.mkdirSync(GAME_FILES_BASE_DIR, { recursive: true });
}

// Helper function to safely convert a URL path to a local file path
function getLocalPathFromUrl(urlPath: string): string {
  try {
    // If the path is already a relative path (starts with /)
    if (urlPath.startsWith('/')) {
      return path.join(process.cwd(), 'public', urlPath);
    }
    
    // Otherwise, try to parse it as a URL
    const parsedUrl = new URL(urlPath, 'http://localhost');
    return path.join(process.cwd(), 'public', parsedUrl.pathname);
  } catch (error) {
    console.error('Error parsing URL path:', urlPath, error);
    // Fallback: just join with the path as-is
    return path.join(process.cwd(), 'public', urlPath);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid game ID' });
  }
  
  // GET request to fetch game details
  if (req.method === 'GET') {
    return handleGetGame(req, res, id);
  }
  
  // PUT request to update game
  if (req.method === 'PUT') {
    return handleUpdateGame(req, res, id);
  }
  
  // DELETE request to delete game
  if (req.method === 'DELETE') {
    return handleDeleteGame(req, res, id);
  }
  
  // Method not allowed
  return res.status(405).json({ message: 'Method not allowed' });
}

async function handleGetGame(req: NextApiRequest, res: NextApiResponse, id: string) {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Find game by ID
    const game = await db.collection('games').findOne({ _id: new ObjectId(id) });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Transform MongoDB _id to id for frontend
    const gameWithId = {
      ...game,
      id: game._id.toString(),
      _id: undefined
    };
    
    return res.status(200).json(gameWithId);
  } catch (error: unknown) {
    logError('handleGetGame', error);
    return res.status(500).json({ 
      message: 'Failed to retrieve game', 
      error: getErrorMessage(error)
    });
  } finally {
    if (client) await client.close();
  }
}

async function handleUpdateGame(req: NextApiRequest, res: NextApiResponse, id: string) {
  // Check authentication
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Find the game to update
    const game = await db.collection('games').findOne({ _id: new ObjectId(id) });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if the current user is the author
    // @ts-ignore - TypeScript doesn't know about id on session.user
    const userId = (session.user as any).id || session.user.email;
    // const authorId = game.author.toString();
    // console.log('UserID user email:', userId);
    // console.log('New Game object:', game.author.toString());

    // Convert the author to string for comparison, handling various author formats
    let authorId;
    if (typeof game.author === 'string') {
      authorId = game.author;
    } else if (typeof game.author === 'object' && game.author !== null) {
      // If author is an object, try to get the ID
      authorId = game.author.toString();
    } else if (game.authorId) {
      // Fallback to authorId field if it exists
      authorId = game.authorId.toString();
    } else {
      // No valid author format found
      authorId = '';
    }
    
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You do not have permission to edit this game' });
    }
    
    // Parse form data
    const form = formidable({
      uploadDir: UPLOADS_DIR,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      multiples: true,
    });
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    
    console.log('Fields received:', Object.keys(fields));
    console.log('Files received:', Object.keys(files));
    
    // Prepare update data
    const updateData: any = {
      title: fields.title?.[0] || game.title,
      description: fields.description?.[0] || game.description,
      category: fields.category?.[0] || game.category,
      lastUpdated: new Date(),
      // Ensure gameDirName is preserved
      gameDirName: game.gameDirName || `game_${id}`,
    };
    
    // Update game type if provided
    if (fields.gameType?.[0]) {
      updateData.gameType = fields.gameType[0];
    }
    
    // Update settings if provided
    if (fields.settings?.[0]) {
      try {
        const settings = JSON.parse(fields.settings[0]);
        updateData.settings = {
          width: settings.width || 800,
          height: settings.height || 600,
          fullscreen: settings.fullscreen || false
        };
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    
    // Initialize files object if it doesn't exist
    if (!updateData.files) {
      updateData.files = game.files || { mainFile: null, assetFiles: [] };
    }
    
    // Process image file
    const removeImageFile = fields.removeImageFile?.[0] === 'true';
    if (removeImageFile) {
      // If the user wants to remove the current image, check if we have a new one
      if (!files.image?.[0]) {
        // Cannot remove image without replacement
        return res.status(400).json({ message: 'A cover image is required' });
      }
    }
    
    if (files.image?.[0]) {
      const imageFile = files.image[0];
      const fileExt = path.extname(imageFile.originalFilename || '');
      const newFilename = `game_${id}_${Date.now()}${fileExt}`;
      const newPath = path.join(UPLOADS_DIR, newFilename);
      
      // Move file to its permanent location
      if (imageFile.filepath !== newPath) {
        fs.copyFileSync(imageFile.filepath, newPath);
        fs.unlinkSync(imageFile.filepath); // Remove the temp file
      }
      
      // Delete old image if it exists and is not a placeholder
      if (game.image && !game.image.includes('placeholder') && !game.image.includes('picsum')) {
        try {
          const oldImagePath = getLocalPathFromUrl(game.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (error) {
          console.error('Error removing old image:', error);
        }
      }
      
      // Update image URL
      updateData.image = `/uploads/games/${game.gameDirName}/${newFilename}`;
    }
    
    // Process main game file
    const removeGameFile = fields.removeGameFile?.[0] === 'true';
    if (removeGameFile && game.files?.mainFile) {
      // Delete the game file if it exists
      try {
        const oldGameFilePath = getLocalPathFromUrl(game.files.mainFile);
        if (fs.existsSync(oldGameFilePath)) {
          fs.unlinkSync(oldGameFilePath);
        }
      } catch (error) {
        console.error('Error removing main game file:', error);
      }
      
      // Remove main file reference
      updateData.files.mainFile = null;
    }
    
    if (files.gameFile?.[0]) {
      const gameFile = files.gameFile[0];
      
      // Use gameDirName from the database if it exists, otherwise create it
      const gameDirName = game.gameDirName || `game_${id}`;
      
      // If gameDirName doesn't exist in the database, add it to updateData
      if (!game.gameDirName) {
        updateData.gameDirName = gameDirName;
      }
      
      const gameDirPath = path.join(UPLOADS_DIR, 'games', gameDirName);
      
      // Ensure the directory exists
      if (!fs.existsSync(gameDirPath)) {
        fs.mkdirSync(gameDirPath, { recursive: true });
      }
      
      // Use the original filename but sanitize it
      const originalName = gameFile.originalFilename || `main${path.extname(gameFile.filepath)}`;
      const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_'); // Remove unsafe characters
      const newPath = path.join(gameDirPath, safeFileName);
      
      // Move file to its permanent location
      if (gameFile.filepath !== newPath) {
        fs.copyFileSync(gameFile.filepath, newPath);
        fs.unlinkSync(gameFile.filepath); // Remove the temp file
      }
      
      // Delete old game file if it exists
      if (game.files?.mainFile) {
        try {
          const oldGameFilePath = getLocalPathFromUrl(game.files.mainFile);
          if (fs.existsSync(oldGameFilePath)) {
            fs.unlinkSync(oldGameFilePath);
          }
        } catch (error) {
          console.error('Error removing old main game file:', error);
        }
      }
      
      // Update game file URL
      updateData.files.mainFile = `/uploads/games/${gameDirName}/${safeFileName}`;
    }
    
    // Handle asset files to remove
    if (fields.removeAssetFiles?.[0]) {
      try {
        const filesToRemove = JSON.parse(fields.removeAssetFiles[0]) as string[];
        console.log('Asset files to remove:', filesToRemove);
        
        // Remove the files physically
        for (const filePath of filesToRemove) {
          try {
            const assetFilePath = getLocalPathFromUrl(filePath);
            if (fs.existsSync(assetFilePath)) {
              fs.unlinkSync(assetFilePath);
              console.log('Removed asset file:', filePath);
            }
          } catch (error) {
            console.error('Error removing asset file:', filePath, error);
          }
        }
        
        // Remove from the database list
        if (Array.isArray(game.files?.assetFiles)) {
          updateData.files.assetFiles = game.files.assetFiles.filter(
            (file: string) => !filesToRemove.includes(file)
          );
        }
      } catch (error) {
        console.error('Error processing asset files to remove:', error);
      }
    } else if (!updateData.files.assetFiles && game.files?.assetFiles) {
      // Keep existing asset files if not specified to remove
      updateData.files.assetFiles = game.files.assetFiles;
    }
    
    // Handle new asset files
    const assetFilesCount = parseInt(fields.assetFilesCount?.[0] || '0');
    if (assetFilesCount > 0) {
      console.log(`Processing ${assetFilesCount} new asset files`);
      
      // Initialize assetFiles array if it doesn't exist
      if (!updateData.files.assetFiles) {
        updateData.files.assetFiles = [];
      }
      
      // Get existing asset files from the game or initialize empty array
      const existingAssetFiles = game.files?.assetFiles || [];
      if (Array.isArray(existingAssetFiles)) {
        // Only copy the asset files if they aren't already copied from the existing game
        if (!updateData.files.assetFiles.length) {
          updateData.files.assetFiles = [...existingAssetFiles];
        }
      }

      console.log('GAME OBJECT:', game);
      
      // Use gameDirName from the database if it exists, otherwise create it
      const gameDirName = game.gameDirName || `game_${id}`;
      
      // If gameDirName doesn't exist in the database, add it to updateData
      if (!game.gameDirName) {
        updateData.gameDirName = gameDirName;
      }
      
      const gameDirPath = path.join(UPLOADS_DIR, 'games', gameDirName);
      
      // Ensure the directory exists
      if (!fs.existsSync(gameDirPath)) {
        fs.mkdirSync(gameDirPath, { recursive: true });
      }
      
      // Function to extract zip file and add its contents to asset files
      const processZipFile = async (zipFilePath: string, fileName: string, gameDirPath: string, gameDirName: string) => {
        try {
          console.log(`Processing zip file: ${fileName}`);
          const zip = new AdmZip(zipFilePath);
          const zipEntries = zip.getEntries();
          const extractedFilePaths: string[] = [];
          
          // Extract all entries to the game directory, maintaining folder structure
          for (const entry of zipEntries) {
            // Skip hidden files
            if (entry.name.startsWith('.')) {
              continue;
            }
            
            // Get the full path including any folders
            const entryPath = entry.entryName;
            
            // For directories, just create them and continue
            if (entry.isDirectory) {
              const dirPath = path.join(gameDirPath, entryPath);
              fs.mkdirSync(dirPath, { recursive: true });
              continue;
            }
            
            // For files, extract them with their folder structure
            // Extract the file preserving the path
            zip.extractEntryTo(
              entry.entryName,  // Entry name with path
              gameDirPath,      // Target directory
              true,             // Maintain the entry's path (preserve folder structure)
              true              // Overwrite existing files
            );
            
            // Add to asset file paths
            extractedFilePaths.push(`/uploads/games/${gameDirName}/${entryPath}`);
            console.log(`Extracted: ${entryPath}`);
          }
          
          console.log(`Extracted ${zipEntries.length} files from ${fileName}`);
          return extractedFilePaths;
        } catch (error) {
          console.error(`Error extracting zip file ${fileName}:`, error);
          return [];
        }
      };
      
      // Process each asset file
      for (let i = 0; i < assetFilesCount; i++) {
        const assetFileKey = `assetFile_${i}`;
        if (files[assetFileKey]?.[0]) {
          // We've already checked that files[assetFileKey][0] exists in the if condition
          // Use non-null assertion or type assertion to tell TypeScript this is safe
          const assetFile = files[assetFileKey]![0];
          const originalName = assetFile.originalFilename || `file_${Date.now()}`;
          
          // Check if the file is a zip file
          if (originalName.toLowerCase().endsWith('.zip')) {
            // Process zip file
            const extractedFiles = await processZipFile(
              assetFile.filepath, 
              originalName, 
              gameDirPath, 
              gameDirName
            );
            
            // Add all extracted files to the asset files array
            updateData.files.assetFiles.push(...extractedFiles);
            
            // Remove the zip file after extraction
            if (fs.existsSync(assetFile.filepath)) {
              fs.unlinkSync(assetFile.filepath);
            }
            
            console.log(`Added ${extractedFiles.length} files from zip: ${originalName}`);
          } else {
            // Process regular asset file
            // Keep the original filename but ensure it's safe
            const safeFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_'); // Remove unsafe characters
            
            // Use the original filename directly (sanitized)
            const newPath = path.join(gameDirPath, safeFileName);
            
            // Handle file name conflicts by adding a counter if needed
            let finalPath = newPath;
            let counter = 1;
            while (fs.existsSync(finalPath)) {
              const fileExt = path.extname(safeFileName);
              const fileName = path.basename(safeFileName, fileExt);
              const newFileName = `${fileName}_${counter}${fileExt}`;
              finalPath = path.join(gameDirPath, newFileName);
              counter++;
            }
            
            // Move file to its permanent location
            if (assetFile.filepath !== finalPath) {
              fs.copyFileSync(assetFile.filepath, finalPath);
              fs.unlinkSync(assetFile.filepath); // Remove the temp file
            }
            
            // Get the final filename used
            const finalFileName = path.basename(finalPath);
            
            // Add to asset files array with the new path structure
            const assetFilePath = `/uploads/games/${gameDirName}/${finalFileName}`;
            updateData.files.assetFiles.push(assetFilePath);
            console.log('Added asset file:', assetFilePath, '(Original name:', originalName, ')');
          }
        }
      }
    }
    
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    // Update game in database
    const result = await db.collection('games').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: 'Failed to update game' });
    }
    
    return res.status(200).json({ 
      message: 'Game updated successfully', 
      id,
      updatedFields: Object.keys(updateData)
    });
  } catch (error: unknown) {
    logError('handleUpdateGame', error);
    return res.status(500).json({ 
      message: 'Failed to update game', 
      error: getErrorMessage(error)
    });
  } finally {
    if (client) await client.close();
  }
}

async function handleDeleteGame(req: NextApiRequest, res: NextApiResponse, id: string) {
  // Check authentication
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(MONGODB_DB);
    
    // Find the game to delete
    const game = await db.collection('games').findOne({ _id: new ObjectId(id) });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if the current user is the author
    // @ts-ignore - TypeScript doesn't know about id on session.user
    const userId = (session.user as any).id || session.user.email;
    
    // Log the relevant values for debugging
    console.log('Delete check - User ID:', userId);
    console.log('Delete check - Game author:', game.author);
    
    // Convert the author to string for comparison, handling various author formats
    let authorId;
    if (typeof game.author === 'string') {
      authorId = game.author;
    } else if (typeof game.author === 'object' && game.author !== null) {
      // If author is an object, try to get the ID
      authorId = game.author.toString();
    } else if (game.authorId) {
      // Fallback to authorId field if it exists
      authorId = game.authorId.toString();
    } else {
      // No valid author format found
      authorId = '';
    }
    
    console.log('Delete check - Computed author ID:', authorId);
    
    if (authorId !== userId) {
      return res.status(403).json({ 
        message: 'You do not have permission to delete this game',
        userInfo: {
          currentUser: userId,
          gameAuthor: authorId
        }
      });
    }
    
    // Delete image file if it exists and is not a placeholder
    if (game.image && !game.image.includes('placeholder') && !game.image.includes('picsum')) {
      try {
        const imagePath = getLocalPathFromUrl(game.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }
    
    // Delete the entire game directory if it exists
    if (game.gameDirName) {
      try {
        const gameDirPath = path.join(UPLOADS_DIR, 'games', game.gameDirName);
        console.log('Attempting to delete game directory:', gameDirPath);
        
        await remove(gameDirPath);
        console.log('Game directory deleted successfully:', game.gameDirName);
      } catch (error) {
        console.error('Error deleting game directory:', error);
      }
    } else {
      console.log('No gameDirName found for game:', id);
      
      // Fallback: try to delete individual files
      // Delete main game file if it exists
      if (game.files?.mainFile) {
        try {
          const gameFilePath = getLocalPathFromUrl(game.files.mainFile);
          if (fs.existsSync(gameFilePath)) {
            fs.unlinkSync(gameFilePath);
          }
        } catch (error) {
          console.error('Error deleting main game file:', error);
        }
      }
      
      // Delete all asset files if they exist
      if (game.files?.assetFiles && Array.isArray(game.files.assetFiles)) {
        for (const assetFile of game.files.assetFiles) {
          try {
            const assetFilePath = getLocalPathFromUrl(assetFile);
            if (fs.existsSync(assetFilePath)) {
              fs.unlinkSync(assetFilePath);
            }
          } catch (error) {
            console.error('Error deleting asset file:', assetFile, error);
          }
        }
      }
    }
    
    // Delete game from database
    const result = await db.collection('games').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(500).json({ message: 'Failed to delete game' });
    }
    
    return res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error: unknown) {
    logError('handleDeleteGame', error);
    return res.status(500).json({ 
      message: 'Failed to delete game', 
      error: getErrorMessage(error)
    });
  } finally {
    if (client) await client.close();
  }
} 