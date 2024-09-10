const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { authorize } = require('./drive');

function uploadFile(filePath) {
  authorize(async (auth) => {
    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
      name: path.basename(filePath),
    };
    const media = {
      mimeType: 'application/octet-stream', // Adjust based on your file type
      body: fs.createReadStream(filePath),
    };

    try {
      const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });
      console.log('File uploaded successfully. File ID:', response.data.id);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  });
}

module.exports = { uploadFile };
