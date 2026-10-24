# Califnco Water — Web Admin Console (M4)

A dedicated operational admin web application for Califnco Water built with **React**, **Vite**, and the **Firebase Web SDK**. Designed for zero-cost hosting on **Vercel** with strict, role-based authorization backed by **Cloud Firestore**.

---

## 🚀 Local Development Setup

From the project root:

```bash
cd admin-web
npm install
npm run dev
```

The Vite dev server will start at `http://localhost:5173`.

---

## 📦 Production Build

```bash
cd admin-web
npm run build
```

The production assets will be built into `admin-web/dist/`.

---

## 🌐 Free Vercel Deployment Guide

1. Push your repository to **GitHub**.
2. Log into [vercel.com](https://vercel.com) (free Hobby tier).
3. Click **"Add New Project"** and import the repository.
4. In the **Project Configuration** settings:
   - **Root Directory**: Click *Edit* and select `admin-web`.
   - **Framework Preset**: `Vite` (automatically detected).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Click **"Deploy"**.
6. The included `vercel.json` ensures all single-page client routes redirect to `index.html` seamlessly without 404 errors.

---

## 🔐 Admin Authorization Setup (Firebase Console)

To prevent arbitrary customers from viewing customer orders or service bookings, admin authorization is enforced at the database level using a dedicated, zero-compute collection: `admins/{adminUid}`.

### Step 1: Create an Admin Account
1. Open the [Firebase Console](https://console.firebase.google.com/) → Project `califnco-water`.
2. Go to **Authentication** → **Users** tab.
3. Click **Add user** and create your operational admin account (e.g., `admin@califnco.com`).
4. Copy the generated **User UID**.

### Step 2: Grant Admin Role in Firestore
1. In Firebase Console, navigate to **Firestore Database**.
2. Click **Start collection** with collection ID: `admins`.
3. Set the **Document ID** to the exact **User UID** copied from Step 1.
4. Add fields:
   - `role`: `"admin"` (string)
   - `email`: `"admin@califnco.com"` (string)
   - `createdAt`: Timestamp
5. Save the document.

### Step 3: Deploy Admin Firestore Rules
Deploy the reviewed rules from `firestore.rules.proposed` using the Firebase Console Rules editor or Firebase CLI:
```javascript
function isAdmin() {
  return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

match /orders/{orderId} {
  allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
  allow update: if isAdmin();
  ...
}

match /serviceBookings/{bookingId} {
  allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
  allow update: if isAdmin();
  ...
}
```

---

## 🛡️ Security Limitations & Integrity

- **Zero Client-Side Route Hiding**: Authorization is strictly enforced by Firestore security rules. Even if a user attempts to manually navigate or bypass UI screens, Firestore denies all unauthenticated or non-admin queries with `permission-denied`.
- **Zero Hardcoded Secrets**: No admin credentials or private service keys are bundled into the web client.
- **Client-Side Sorting**: All queries are sorted descending by `createdAt` in memory after retrieval to eliminate missing composite index errors on Firestore free tier.
