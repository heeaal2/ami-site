# Deploy AMI Backend to Render

## Step 1: Create GitHub Repository for Backend

1. Create a new repository on GitHub called `ami-backend`
2. Copy these files to the new repo:
   - `server.js`
   - `backend-package.json` (rename to `package.json`)

## Step 2: Environment Variables

Set these environment variables in Render:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/event-management
PORT=10000
```

## Step 3: Deploy on Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your `ami-backend` repository
5. Configure:
   - **Name**: `ami-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

## Step 4: Update Frontend

After deployment, update your frontend to use the Render URL:

In `src/App.js` and `src/AdminPage.js`, change:
```javascript
const baseUrl = process.env.NODE_ENV === 'production' 
  ? 'https://ami-backend-xyz.onrender.com'  // Your Render URL
  : 'http://localhost:5001';
```

## Step 5: MongoDB Atlas (Free)

1. Go to https://mongodb.com/atlas
2. Create free cluster
3. Add database user
4. Get connection string
5. Add to Render environment variables

## File Structure for Backend Repo:
```
ami-backend/
├── server.js
├── package.json
└── README.md
``` 