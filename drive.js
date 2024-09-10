const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json'); // Path to your credentials file

/**
 * Authorize using service account credentials
 */
async function authorize() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_email, private_key } = credentials;

  const auth = new google.auth.JWT(
    client_email,
    null,
    private_key,
    SCOPES
  );

  return auth;
}

module.exports = { authorize };
