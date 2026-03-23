import { Song } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export async function fetchSongsFromGithub(repoOwner: string, repoName: string, path: string): Promise<Song[]> {
  const url = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/contents/${path}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch content from GitHub: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('GitHub path is not a directory');
    }

    const audioExtensions = ['.mp3', '.wav', '.ogg'];
    const audioFiles = data.filter((file: any) => 
      file.type === 'file' && audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );

    // Try to find a cover image in the same folder
    const coverFile = data.find((file: any) => 
      file.type === 'file' && (file.name.toLowerCase() === 'cover.jpg' || file.name.toLowerCase() === 'cover.png')
    );
    const coverUrl = coverFile ? coverFile.download_url : undefined;

    return audioFiles.map((file: any) => {
      // Basic title extraction from filename
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      
      return {
        id: file.sha,
        title: title,
        artist: 'Unknown Artist', // GitHub API doesn't provide metadata easily without downloading
        url: file.download_url,
        coverUrl: coverUrl || `https://picsum.photos/seed/${file.sha}/300/300`,
        fileName: file.name
      };
    });
  } catch (error) {
    console.error('Error fetching songs:', error);
    return [];
  }
}
