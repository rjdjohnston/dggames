import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { getErrorMessage, logError } from '../../../utils/errorHandling';

// Define a type for formidable file
interface FormidableFile {
  filepath: string;
  originalFilename?: string;
  newFilename?: string;
  mimetype?: string;
  size?: number;
  [key: string]: any;
}

// Disable the default body parser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Check if the user is authenticated
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fsPromises.mkdir(uploadDir, { recursive: true });

    // Parse the form data
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    // Parse the form
    const formData = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ fields, files });
      });
    });

    // Get the avatar file
    const { files } = formData;
    const fileKey = 'avatar';
    const fileOrFiles = files[fileKey];
    
    if (!fileOrFiles) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    // Convert to array and ensure it's properly typed
    const avatarFile = Array.isArray(fileOrFiles) 
      ? (fileOrFiles[0] as unknown as FormidableFile)
      : (fileOrFiles as unknown as FormidableFile);

    if (!avatarFile) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(avatarFile.mimetype || '')) {
      // Remove the uploaded file
      fs.unlinkSync(avatarFile.filepath);
      return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
    }

    // Generate a unique filename
    const userId = session.user.id;
    const timestamp = Date.now();
    const fileExtension = path.extname(avatarFile.originalFilename || avatarFile.filepath);
    const newFilename = `avatar_${userId}_${timestamp}${fileExtension}`;
    const newFilepath = path.join(uploadDir, newFilename);
    
    // Debug information
    console.log('Avatar upload debug info:');
    console.log('- Original file:', avatarFile.originalFilename);
    console.log('- Upload directory:', uploadDir);
    console.log('- New filepath:', newFilepath);
    console.log('- File exists before rename:', fs.existsSync(avatarFile.filepath));

    // Rename the file
    await fsPromises.rename(avatarFile.filepath, newFilepath);
    
    // Verify file was saved correctly
    console.log('- File exists after rename:', fs.existsSync(newFilepath));

    // Generate the public URL with a timestamp for cache busting
    const imageUrl = `/uploads/avatars/${newFilename}?v=${timestamp}`;
    console.log('- Generated image URL:', imageUrl);

    // Update the user's avatar in the database
    await dbConnect();
    
    // Find the user first to verify
    const existingUser = await User.findById(userId);
    console.log('- Existing user before update:', existingUser ? 'Found' : 'Not found');
    console.log('- Existing user image:', existingUser?.image);
    
    // Update the user with the new image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { image: imageUrl }, 
      { new: true }
    );
    
    console.log('- Updated user image in DB:', updatedUser?.image);
    console.log('- Update successful:', updatedUser ? 'Yes' : 'No');
    
    // Double-check the update
    const verifyUser = await User.findById(userId);
    console.log('- Verified user image after update:', verifyUser?.image);

    // Return the image URL
    return res.status(200).json({ 
      message: 'Avatar uploaded successfully',
      imageUrl,
      userId,
      previousImage: existingUser?.image,
      updatedImage: updatedUser?.image
    });
  } catch (error: unknown) {
    logError('avatar upload', error);
    return res.status(500).json({ 
      message: 'Failed to upload avatar', 
      error: getErrorMessage(error) 
    });
  }
} 