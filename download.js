const { google } = require('googleapis');
const fs = require('fs');
const { authorize } = require('./drive');

function downloadFile(fileId, dest) {
  authorize(async (auth) => {
    const drive = google.drive({ version: 'v3', auth });

    try {
      const response = await drive.files.get(
        { fileId: fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      const destStream = fs.createWriteStream(dest);
      response.data
        .on('end', () => {
          console.log('Download complete.');
        })
        .on('error', (err) => {
          console.error('Error downloading file:', err);
        })
        .pipe(destStream);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  });
}

module.exports = { downloadFile };
