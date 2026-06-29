# Firebase & Vercel Production Deployment Checklist

Cube Count requires a Firebase Realtime Database for online lockstep synchronization and Vercel for fast frontend hosting.

Follow this checklist strictly to deploy the application.

## 1. Firebase Project Creation
- [ ] Go to [Firebase Console](https://console.firebase.google.com/).
- [ ] Click **Create a project**.
- [ ] Name the project (e.g., `cube-count-prod`).
- [ ] Disable Google Analytics (not required).

## 2. Authentication Setup
- [ ] In the Firebase Console, go to **Build > Authentication**.
- [ ] Click **Get Started**.
- [ ] Go to the **Sign-in method** tab.
- [ ] Enable **Anonymous** and save.

## 3. Realtime Database Setup
- [ ] Go to **Build > Realtime Database**.
- [ ] Click **Create Database**.
- [ ] Choose a location closest to your expected user base.
- [ ] Select **Start in locked mode**.

## 4. Security Rules Deployment
- [ ] In the Realtime Database dashboard, click the **Rules** tab.
- [ ] Copy the exact contents of `database.rules.json` from the root of this repository.
- [ ] Paste them into the rules editor and click **Publish**.
- [ ] *Note: These rules restrict read/write to room members only and allow hosts to clean up inactive rooms.*

## 5. Web App Registration & Environment Variables
- [ ] Click the **Gear icon (Project Settings) > General**.
- [ ] Scroll down and click the **</>** icon to add a web app.
- [ ] Name it (e.g., `Cube Count Web`).
- [ ] Copy the `firebaseConfig` object values.
- [ ] Rename `.env.example` to `.env.local` in your local repository for local testing.
- [ ] Paste the values into your environment variables.

## 6. Vercel Deployment
- [ ] Push your repository to GitHub.
- [ ] Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
- [ ] Import your GitHub repository.
- [ ] Vercel will automatically detect **Vite** as the framework.
- [ ] Expand the **Environment Variables** section.
- [ ] Add all `VITE_FIREBASE_*` variables from step 5.
- [ ] Click **Deploy**.
- [ ] Vercel will automatically read `vercel.json` in the root directory to handle SPA client-side routing properly for `/play/:roomCode`.

## 7. Production Verification
- [ ] Navigate to the Vercel-provided URL.
- [ ] Test room creation: Create a room and ensure a code is generated.
- [ ] Test invite links: Click "Copy Invite Link" and open it in an Incognito window.
- [ ] Test auto-join: Enter a display name in the Incognito window and ensure it automatically joins the waiting room.
- [ ] Test gameplay: Start the match and verify both windows sync properly and progress through the FSM phases.
- [ ] Test disconnection: Close one window during the match and verify the `ReconnectOverlay` appears on the other window.
