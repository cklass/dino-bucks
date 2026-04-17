# 🦕 Dino Bucks — Setup Guide

This is a real-time classroom economy app. Your laptop projects it on the whiteboard
while your phone controls it — all changes sync instantly between devices.

---

## What you'll need (all free, ~20 minutes total)

- A Google account (for Firebase)
- A GitHub account (free at github.com)
- A Vercel account (free at vercel.com)

---

## STEP 1 — Set up Firebase (your real-time database)

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `dino-bucks` → click through the setup (disable Google Analytics if asked)
3. Once inside your project, click the **"Web"** icon ( </> ) to add a web app
4. Give it a nickname (e.g. `dino-bucks-web`) → click **"Register app"**
5. You'll see a `firebaseConfig` object — **copy all 7 values** — you'll need them in Step 3

6. Now set up the database:
   - In the left sidebar: **Build → Realtime Database**
   - Click **"Create database"**
   - Choose **"Start in test mode"** → pick any server location → click **Done**

That's Firebase done ✅

---

## STEP 2 — Put the code on GitHub

1. Go to https://github.com and sign in (create a free account if needed)
2. Click the **"+"** in the top right → **"New repository"**
3. Name it `dino-bucks` → keep it **Public** → click **"Create repository"**
4. On the next page, click **"uploading an existing file"**
5. Upload the entire `dinobucks` folder you downloaded
   - You need to upload ALL files maintaining the folder structure:
     - `package.json`
     - `public/index.html`
     - `src/App.js`
     - `src/index.js`
     - `src/firebase.js`
     - `src/firebaseConfig.js`
6. Click **"Commit changes"**

GitHub done ✅

---

## STEP 3 — Fill in your Firebase config

Before deploying, open `src/firebaseConfig.js` in GitHub and replace the
placeholder values with your actual Firebase config values from Step 1.

In GitHub:
1. Click on `src/firebaseConfig.js`
2. Click the pencil ✏️ icon to edit
3. Replace each `"PASTE_YOUR_..."` value with your actual Firebase values
4. Click **"Commit changes"**

---

## STEP 4 — Deploy to Vercel (get your URL)

1. Go to https://vercel.com and sign in with your GitHub account
2. Click **"Add New Project"**
3. Find your `dino-bucks` repository → click **"Import"**
4. Vercel will auto-detect it as a React app — don't change any settings
5. Click **"Deploy"**
6. After ~2 minutes, Vercel gives you a URL like: `dino-bucks-abc123.vercel.com`

**That URL is your app — open it on any device!**

---

## Using the app

### On your laptop (projector display)
- Open the URL in Chrome
- Project that browser tab through your projector
- The screen updates automatically when you do things on your phone

### On your phone
- Open the same URL in Safari or Chrome
- Add it to your home screen for an app-like experience:
  - **iPhone:** tap the Share button → "Add to Home Screen"
  - **Android:** tap the menu → "Add to Home Screen"
- All controls work from your phone — pay students, run payday, rotate jobs

### Real-time sync
- Any action on any device (phone, laptop, another tab) updates everywhere instantly
- No refresh needed — the projector screen updates on its own

---

## Weekly job rotation

- Every Monday when the app opens, jobs automatically shuffle
- No student gets the same job two weeks in a row
- You can also tap **"🔄 New Week"** anytime to rotate manually

---

## Payday

- Tap **"💰 Payday!"** to pay every student their job salary at once
- Students without a job assigned get $0

---

## Troubleshooting

**"Loading Dino Bucks... Connecting to Firebase"** and it stays there:
→ Your Firebase config values in `firebaseConfig.js` are probably wrong. Double-check them.

**Changes on my phone don't show on the laptop:**
→ Make sure both devices are using the exact same URL.
→ Check that your Realtime Database is in "Test mode" (not locked down).

**I want to update the app (add features, fix something):**
→ Edit the files in your GitHub repo → Vercel automatically rebuilds and redeploys within ~1 minute.

---

## File structure

```
dinobucks/
├── package.json          ← app dependencies
├── public/
│   └── index.html        ← HTML shell
└── src/
    ├── App.js            ← main app (all UI and logic)
    ├── firebase.js       ← Firebase connection
    ├── firebaseConfig.js ← YOUR CONFIG GOES HERE
    └── index.js          ← React entry point
```
