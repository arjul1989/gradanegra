const admin = require('firebase-admin');
const path = require('path');

const EMAIL = process.argv[2] || 'arjul1989@gmail.com';

async function main() {
  const credsPath = path.join(__dirname, '..', 'firebase-credentials.json');
  let serviceAccount;
  try {
    serviceAccount = require(credsPath);
  } catch (err) {
    console.error('Could not load firebase credentials from', credsPath);
    console.error(err);
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  try {
    const userRecord = await admin.auth().getUserByEmail(EMAIL);
    console.log('Found user:', userRecord.uid, userRecord.email);
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true, adminRole: 'super_admin' });
    console.log(`Set admin claim for ${EMAIL}`);
    process.exit(0);
  } catch (err) {
    console.error('Error setting admin claim:', err.message || err);
    process.exit(2);
  }
}

main();
