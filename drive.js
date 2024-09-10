const { google } = require('googleapis');
const dotenv = require("dotenv");
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64; // Base64 encoded credentials

if (!credentialsBase64) {
    throw new Error('Missing credentials environment variable.');
}

// Decode and parse credentials
const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
const CREDENTIALS = JSON.parse(credentialsJson); // Ensure CREDENTIALS is defined here

/**
 * Authorize using service account credentials
 */
async function authorize() {
  const { client_email, private_key } = CREDENTIALS;

  const auth = new google.auth.JWT(
    client_email,
    null,
    private_key,
    SCOPES
  );

  return auth;
}

module.exports = { authorize };
