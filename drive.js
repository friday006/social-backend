const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64; // Path to your credentials file

if (!credentialsBase64) {
    throw new Error('Missing credentials environment variable.');
}
const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
const CREDENTIALS_PATH = JSON.parse(credentialsJson);

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
