const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { authorize } = require('./drive'); // Import the authorize function

/**
 * Upload file to Google Drive
 */
async function uploadFile(filePath, fileName) {
    const auth = await authorize();  // Make sure this is your Google auth function
    const drive = google.drive({ version: 'v3', auth });
  
    const fileMetadata = {
      name: fileName,
      parents: ['1ASobD0OKZVkROJZh2DAfrqvZ1XjNI2d7']  // Replace with the actual folder ID
    };
  
    const media = {
      mimeType: 'image/jpeg',  // Adjust this based on file type
      body: fs.createReadStream(filePath),
    };
  
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });
  
    const fileId = response.data.id;
    console.log('File uploaded successfully, File ID: ', fileId);
  
    // Make file publicly accessible
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  
    return fileId;
  }

module.exports = { uploadFile };
