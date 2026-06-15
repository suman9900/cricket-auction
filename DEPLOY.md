# 🌐 Cricket Bidding Platform - Complete Deployment Guide

This guide provides step-by-step instructions to host your full-stack **Cricket Bidding Platform** globally. 

Because your application is a full-stack project consisting of a **React Frontend (Vite)** and a **Real-Time WebSocket Backend (Socket.io/Express)**, standard static hosts like Vercel will only render the frontend landing page, and the interactive real-time auction features will fail to connect. 

To solve this, we have upgraded your project to support **two flexible hosting options**:
1. **Option A (Highly Recommended): Unified Single-Service Deployment** (Easiest, zero-config, 100% free on **Render**)
2. **Option B: Split-Service Cloud Deployment** (High performance, lightning-fast CDN frontend on **Vercel** + WebSocket server on **Render**)

---

## 🛠️ Step 1: Push Your Code to GitHub (Required for both)
We have already initialized a local Git repository and committed all your source code. You only need to push it to your GitHub:

1. Go to [github.com/new](https://github.com/new) and create a repository named `cricket-auction`.
2. Keep it **Public** or **Private** (either works).
3. Run the following commands in your terminal to link and push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/cricket-auction.git
   git push -u origin main
   ```

---

## 🚀 Option A: Unified Single-Service Hosting (Recommended & Easiest)
We upgraded the Node.js server (`server.js`) to automatically compile and serve the React frontend assets in production. This allows you to host the **entire project** on Render under a single URL!

### How to set it up:
1. Go to [dashboard.render.com](https://dashboard.render.com/) and log in (using GitHub).
2. Click **New +** and select **Web Service**.
3. Select your `cricket-auction` repository.
4. Configure the Web Service with the following details:
   - **Name**: `cricket-auction`
   - **Region**: Choose the closest region (e.g., *Singapore* or *Oregon*)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build` *(This installs dependencies and compiles the frontend)*
   - **Start Command**: `node server.js` *(This starts the Socket server which also serves the frontend)*
   - **Instance Type**: `Free`
5. Click **Advanced** and add one Environment Variable:
   - **Key**: `PORT`
   - **Value**: `3000`
6. Click **Create Web Service**.

Once the deployment completes, Render will provide a single URL (e.g., `https://cricket-auction.onrender.com`). **Open this URL—your full platform is live with all features (real-time bidding, logins, setup) 100% working!**

---

## ⚡ Option B: Split-Service Cloud Deployment (Vercel + Render)
If you prefer Vercel's ultra-fast global CDN for your frontend while running the WebSockets on Render, follow this approach.

### Step 2.1: Deploy the Backend on Render
1. Go to [dashboard.render.com](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Select your `cricket-auction` repository.
3. Configure the web service with:
   - **Name**: `cricket-auction-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
4. Click **Advanced** and add the Environment Variable:
   - **Key**: `PORT`
   - **Value**: `3000`
5. Click **Create Web Service**.
6. **Copy the public URL** Render generates (e.g., `https://cricket-auction-backend.onrender.com`).

### Step 2.2: Deploy the Frontend on Vercel
1. Go to [vercel.com](https://vercel.com/) and log in using GitHub.
2. Click **Add New** > **Project** and import your `cricket-auction` repository.
3. Vercel automatically detects the **Vite (React)** workspace.
4. Expand the **Environment Variables** section and add:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: `https://YOUR-RENDER-BACKEND-SUBDOMAIN.onrender.com` *(Paste the Render URL you copied in Step 2.1)*
5. Click **Deploy**.

Open your Vercel URL (e.g., `https://cricket-auction.vercel.app`), and your frontend will securely link to your Render WebSockets backend for live bidding!

---

## 🎯 Verification Checklist
* Open the live site (Render or Vercel URL).
* Try creating a tournament on the landing page (only works when backend is active).
* Open the **Developer Console** (F12) to verify there are no Red Connection Errors and that WebSocket synchronization is active.
* Share the live link with your tournament captains and players!
