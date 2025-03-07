import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import dbConnect from '../../../lib/mongodb';
import Game from '../../../models/Game';
import { ObjectId } from 'mongodb';
import AdmZip from 'adm-zip';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Create upload directories if they don't exist
    const uploadsDir = path.join(process.cwd(), 'public/uploads');
    const tempDir = path.join(uploadsDir, 'temp');
    const gamesDir = path.join(uploadsDir, 'games');
    
    await fsPromises.mkdir(uploadsDir, { recursive: true });
    await fsPromises.mkdir(tempDir, { recursive: true });
    await fsPromises.mkdir(gamesDir, { recursive: true });
    
    const options = {
      uploadDir: tempDir,
      keepExtensions: true,
      multiples: true,
    };
    
    // Parse the form with a Promise wrapper
    const formData = await new Promise<{fields: formidable.Fields, files: formidable.Files}>((resolve, reject) => {
      const form = formidable(options);
      
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });
    
    const { fields, files } = formData;
    
    // Convert fields to string (formidable v4 returns arrays for fields)
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title as string;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description as string;
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category as string;
    const gameType = Array.isArray(fields.gameType) ? fields.gameType[0] : fields.gameType as string;
    
    if (!title || !description || !category || !gameType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create a unique directory for this game
    const gameId = new ObjectId();
    const gameDirName = `game_${gameId}`;
    console.log('Creating game with directory name:', gameDirName);
    
    const gameFullPath = path.join(gamesDir, gameDirName);
    
    await fsPromises.mkdir(gameFullPath, { recursive: true });
    
    // Handle files - formidable v4 returns arrays for files
    const mainFileArray = Array.isArray(files.mainFile) ? files.mainFile : [files.mainFile];
    const mainFile = mainFileArray[0];
    
    if (!mainFile) {
      return res.status(400).json({ message: 'Missing main game file' });
    }
    
    // Get file details safely
    const mainFilePath = mainFile.filepath;
    const mainFileName = mainFile.originalFilename || path.basename(mainFilePath);
    const mainFileDest = path.join(gameFullPath, mainFileName);
    
    // Copy main file
    await fsPromises.copyFile(mainFilePath, mainFileDest);
    
    // Process asset files
    const assetFilePaths: string[] = [];
    
    // Function to extract zip file and add its contents to asset files
    const processZipFile = async (zipFilePath: string, fileName: string) => {
      try {
        console.log(`Processing zip file: ${fileName}`);
        const zip = new AdmZip(zipFilePath);
        const zipEntries = zip.getEntries();
        
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
            const dirPath = path.join(gameFullPath, entryPath);
            await fsPromises.mkdir(dirPath, { recursive: true });
            continue;
          }
          
          // For files, extract them with their folder structure
          // Extract the file preserving the path
          zip.extractEntryTo(
            entry.entryName,  // Entry name with path
            gameFullPath,     // Target directory
            true,             // Maintain the entry's path (preserve folder structure)
            true              // Overwrite existing files
          );
          
          // Add to asset file paths
          assetFilePaths.push(`/uploads/games/${gameDirName}/${entryPath}`);
          console.log(`Extracted: ${entryPath}`);
        }
        
        console.log(`Extracted ${zipEntries.length} files from ${fileName}`);
        return true;
      } catch (error) {
        console.error(`Error extracting zip file ${fileName}:`, error);
        return false;
      }
    };
    
    // Handle asset files
    for (const key in files) {
      if (key.startsWith('assetFile_')) {
        const assetFileArray = Array.isArray(files[key]) ? files[key] : [files[key]];
        const assetFile = assetFileArray[0];
        
        if (assetFile) {
          const assetFilePath = assetFile.filepath;
          const assetFileName = assetFile.originalFilename || path.basename(assetFilePath);
          
          // Check if the file is a zip file
          if (assetFileName.toLowerCase().endsWith('.zip')) {
            // Process zip file
            await processZipFile(assetFilePath, assetFileName);
          } else {
            // Process regular asset file
            const assetFileDest = path.join(gameFullPath, assetFileName);
            await fsPromises.copyFile(assetFilePath, assetFileDest);
            assetFilePaths.push(`/uploads/games/${gameDirName}/${assetFileName}`);
          }
        }
      }
    }
    
    // Process thumbnail file
    let thumbnailPath = '';
    
    if (files.thumbnailFile) {
      const thumbnailFileArray = Array.isArray(files.thumbnailFile) ? files.thumbnailFile : [files.thumbnailFile];
      const thumbnailFile = thumbnailFileArray[0];
      
      if (thumbnailFile) {
        const thumbnailFilePath = thumbnailFile.filepath;
        const thumbnailFileName = thumbnailFile.originalFilename || path.basename(thumbnailFilePath);
        const thumbnailDest = path.join(gameFullPath, thumbnailFileName);
        
        await fsPromises.copyFile(thumbnailFilePath, thumbnailDest);
        thumbnailPath = `/uploads/games/${gameDirName}/${thumbnailFileName}`;
      }
    }
    
    // Clean up temp files
    for (const key in files) {
      const fileOrFiles = files[key];
      const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
      
      for (const file of fileArray) {
        if (file && file.filepath && fs.existsSync(file.filepath)) {
          await fsPromises.unlink(file.filepath);
        }
      }
    }
    
    // Create game in database
    const gameData = {
      title,
      description,
      category,
      gameType,
      image: thumbnailPath || 'https://picsum.photos/400/225', // Use thumbnail or default image
      files: {
        mainFile: `/uploads/games/${gameDirName}/${mainFileName}`,
        assetFiles: assetFilePaths,
        thumbnails: thumbnailPath ? [thumbnailPath] : []
      },
      settings: {
        width: 800,
        height: 600,
        fullscreen: true
      },
      author: session.user.id,
      plays: 0,
      likes: 0,
      lastUpdated: new Date(),
      createdAt: new Date(),
      gameDirName: gameDirName
    };
    
    console.log('Saving game with data:', JSON.stringify({
      ...gameData,
      files: {
        mainFile: gameData.files.mainFile,
        assetFiles: `${gameData.files.assetFiles.length} files`,
        thumbnails: gameData.files.thumbnails
      }
    }, null, 2));
    
    const game = new Game(gameData);
    
    await game.save();
    
    console.log('Game saved successfully with ID:', game._id);
    
    return res.status(201).json({
      success: true,
      message: 'Game uploaded successfully',
      game: {
        id: game._id,
        title: game.title
      }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 