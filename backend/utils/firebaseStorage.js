const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

/**
 * Uploads a file buffer to Firebase Storage and returns the public URL.
 * @param {Buffer} buffer - The file buffer from multer.
 * @param {string} originalName - Original filename for extension.
 * @param {string} folder - Folder in storage (e.g., 'rooms', 'id-proofs').
 * @returns {Promise<string>} - The public URL of the uploaded file.
 */
const uploadToFirebase = async (buffer, originalName, folder = 'uploads') => {
  try {
    const bucket = admin.storage().bucket();
    const extension = originalName.split('.').pop();
    const fileName = `${folder}/${uuidv4()}.${extension}`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: getContentType(extension),
      },
    });

    // Make the file public or get a signed URL. 
    // For simplicity in this app, we'll use a public configuration if possible, 
    // or get a signed URL with a long expiration.
    // Standard Firebase public URL format:
    // https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[FILE_PATH]?alt=media
    const encodedPath = encodeURIComponent(fileName);
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media`;
    
    return publicUrl;
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

const getContentType = (extension) => {
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
  };
  return types[extension.toLowerCase()] || 'application/octet-stream';
};

module.exports = { uploadToFirebase };
