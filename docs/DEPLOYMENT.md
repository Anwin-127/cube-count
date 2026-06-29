# Cube Count Deployment Guide

This guide details how to set up the Firebase backend and deploy the application to Vercel.

## 1. Firebase Project Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the prompts.
3. Once created, click the **Web** icon (`</>`) to add a web app.
4. Register the app (you can skip Firebase Hosting if using Vercel).
5. Copy the `firebaseConfig` object values. These will be your environment variables.

## 2. Authentication Setup

1. In the Firebase Console, go to **Build > Authentication**.
2. Click **Get Started**.
3. Go to the **Sign-in method** tab.
4. Enable **Anonymous**.

## 3. Realtime Database Setup

1. In the Firebase Console, go to **Build > Realtime Database**.
2. Click **Create Database** and select a location.
3. Start in **Locked mode** (we will deploy strict rules).
4. Go to the **Rules** tab and paste the contents of `database.rules.json` from this repository.
5. Publish the rules.

## 4. Environment Variables

Create a `.env.local` file in the root of your project or configure these in your Vercel deployment settings:

```env
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

## 5. Vercel Deployment

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and create a **New Project**.
3. Import your GitHub repository.
4. The framework preset should automatically detect **Vite**.
5. In the **Environment Variables** section, paste all the `VITE_FIREBASE_*` variables from step 4.
6. Click **Deploy**.

## 6. Production Verification

Once deployed, verify the following:
- Ensure the app loads without errors in the console.
- Open the app in two separate browsers/devices.
- Create a room on one device and verify the room code.
- Join the room on the second device.
- Complete a match to verify lockstep synchronization works across the network.
- Test the invite link functionality (`/play/:roomCode`).
