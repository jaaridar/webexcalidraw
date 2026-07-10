# Excalidraw Clone

A minimal, serverless Excalidraw clone ready to deploy on Vercel.

## Features

- ✅ Create unlimited canvases with unique IDs
- ✅ Dashboard to manage all your canvases
- ✅ Auto-save to Vercel KV (Redis-compatible)
- ✅ Load existing canvases from list
- ✅ Export as PNG/SVG
- ✅ Dark/Light mode support
- ✅ Shareable links
- ✅ Delete canvases

## Setup & Deployment

### 1. Install dependencies
```bash
yarn install
# or
npm install
```

### 2. Enable Vercel KV
Create a `kv` store in your Vercel project:
```bash
vercel kv:create
```

### 3. Deploy to Vercel
```bash
vercel --prod
```

### 4. Use locally
```bash
yarn dev
# or
npm run dev
```
Then open http://localhost:3000

## How It Works (UI/UX)

### Canvas Dashboard
1. When you open the app, you see a list of all your canvases
2. Click "+ Create New Canvas" to start a fresh drawing
3. Each canvas shows its unique ID - click "Open" to edit
4. Click "Delete" to remove a canvas from the list

### Editor View
1. Full Excalidraw toolbar appears (shapes, text, arrows, free-draw, etc.)
2. Canvas auto-saves after 1 second of inactivity
3. Click "← Back to Canvases" to return to dashboard
4. Use built-in Export button to save as PNG/SVG

### Persistence
- Canvases are stored in Vercel KV
- Each canvas has a unique 8-character ID
- Share URLs with `?id=YOUR_ID` for others to view/edit

## Architecture

```
excalidraw-clone/
├── api/
│   ├── save.ts    # POST /api/save - Saves canvas to KV
│   └── load.ts    # GET /api/load?id=... - Loads canvas from KV
├── src/
│   ├── App.tsx    # Dashboard + Editor with persistence
│   └── main.tsx   # Entry point
├── vercel.json    # Vercel configuration
└── package.json
```

## Tech Stack

- **Frontend**: React 18, Vite, @excalidraw/excalidraw
- **Storage**: Vercel KV
