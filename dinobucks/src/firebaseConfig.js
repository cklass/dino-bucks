// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 OF SETUP: Replace the values below with your Firebase project config.
//
// How to get these values:
//   1. Go to https://console.firebase.google.com
//   2. Create a new project (call it "dino-bucks" or anything you like)
//   3. Click "Web" (</>) to add a web app
//   4. Copy the firebaseConfig object values into the fields below
//   5. In the Firebase console left sidebar: Build → Realtime Database → Create database
//      → Start in TEST MODE → pick any region → Done
// ─────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            "PASTE_YOUR_API_KEY_HERE",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN_HERE",
  databaseURL:       "PASTE_YOUR_DATABASE_URL_HERE",
  projectId:         "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket:     "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId:             "PASTE_YOUR_APP_ID_HERE",
};

export default firebaseConfig;
