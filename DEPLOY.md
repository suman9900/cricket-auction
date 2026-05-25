# 🌐 Option B: Complete Cloud Deployment Guide
This guide provides step-by-step instructions to host your full-stack **Cricket Bidding Platform** globally using **Vercel** (for the lightning-fast React frontend) and **Render** (for the real-time Socket.io Node.js backend).

This architecture ensures high performance, 100% reliable persistent WebSockets for live bidding, and is completely free to set up.

---

## 🛠️ Step 1: Push Your Code to GitHub
We have already initialized a local Git repository and committed all your source code. You only need to create a repository on your GitHub account and push the code:

1. Go to [github.com/new](https://github.com/new) and create a repository named `cricket-auction`.
2. Keep it **Public** or **Private** (either works).
3. Run the following commands in your terminal to link and push your code:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/cricket-auction.git
   git push -u origin main
   ```

---

## ⚡ Step 2: Deploy the Backend on Render
Render will host your active Socket.io backend and database server. It automatically installs dependencies and exposes the port.

1. Go to [dashboard.render.com](https://dashboard.render.com/) and log in (e.g., using GitHub).
2. Click **New +** and select **Web Service**.
3. Link your GitHub account and select your `cricket-auction` repository.
4. Configure the web service with these settings:
   - **Name**: `cricket-auction-backend`
   - **Region**: Choose the closest region (e.g., *Singapore* or *Oregon*)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Click **Advanced** and add the following Environment Variable:
   - Key: `PORT`
   - Value: `3000`
6. Click **Create Web Service**.

> **Note:** Once Render finishes deploying, it will give you a public URL (e.g., `https://cricket-auction-backend.onrender.com`). **Copy this URL** for the next step!

---

## 🚀 Step 3: Deploy the Frontend on Vercel
Vercel will build and host your premium frontend UI, serving it over a fast global CDN.

1. Go to [vercel.com](https://vercel.com/) and log in using GitHub.
2. Click **Add New** > **Project**.
3. Import your `cricket-auction` repository.
4. Vercel will automatically detect that this is a **Vite (React)** project and configure the build settings.
5. Expand the **Environment Variables** section and add:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: `https://YOUR-RENDER-BACKEND-SUBDOMAIN.onrender.com` *(Paste the Render public URL you copied in Step 2)*
6. Click **Deploy**.

---

## 🎯 Verification Checklist
Once both builds succeed:
* Vercel will give you a custom production domain (e.g., `https://cricket-auction.vercel.app`).
* Open your Vercel frontend URL. You should see the sleek Stadium Auction landing page!
* Open the **Developer Console** (F12) to verify that the frontend connects successfully to your Render backend via WebSockets.
* Share the Vercel link with your friends and team captains to start bidding live!

> **Tip:** **Why this setup is perfect for live events:**
> Render's free tier spins down if there is no traffic for 15 minutes. However, because our auction client opens a active socket connection, **the server will stay 100% active and responsive throughout your live event** without any idle resets!
