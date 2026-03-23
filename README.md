# GitHub Music Player

A modern, Spotify-inspired web music player that automatically detects and streams audio files from a GitHub repository.

## Features

- **Auto-Detect**: Scans a GitHub folder for `.mp3`, `.wav`, and `.ogg` files.
- **Spotify UI**: Dark mode, responsive design, and smooth animations.
- **Playback Controls**: Play/Pause, Seek, Volume, Next/Prev, Shuffle, and Loop.
- **GitHub Integration**: Streams directly from GitHub raw URLs.
- **Album Art**: Uses `cover.jpg` from the repo or generates placeholders.

## Configuration

To change the source GitHub repository, update the environment variables in your deployment platform or create a `.env` file:

```env
VITE_GITHUB_OWNER="your-username"
VITE_GITHUB_REPO="your-repo-name"
VITE_GITHUB_PATH="music"
```

Default values are set in `src/App.tsx` if these are not provided.

## Deployment on Vercel

1. **Push your code** to a GitHub repository.
2. **Connect to Vercel**:
   - Go to [Vercel](https://vercel.com) and click "Add New" -> "Project".
   - Import your repository.
3. **Configure Environment Variables**:
   - Add `VITE_GITHUB_OWNER`, `VITE_GITHUB_REPO`, and `VITE_GITHUB_PATH`.
4. **Deploy**: Click "Deploy". Vercel will automatically detect the Vite setup.

## Deployment on GitHub Pages

1. **Update `vite.config.ts`**:
   - Uncomment the `base` line and set it to your repository name: `base: '/your-repo-name/'`.
2. **Install `gh-pages`**: `npm install gh-pages --save-dev`.
3. **Add scripts to `package.json`**:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
4. **Deploy**: Run `npm run deploy`.
5. **Configure GitHub**: In your repo settings, go to "Pages" and set the source to the `gh-pages` branch.

## How to add music

1. Create a public GitHub repository.
2. Create a folder (e.g., `music`).
3. Upload your audio files (`.mp3`, `.wav`, `.ogg`) to that folder.
4. (Optional) Add a `cover.jpg` or `cover.png` to the same folder for album art.
5. Update the app configuration to point to your repo.
