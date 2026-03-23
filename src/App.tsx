import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  Search, 
  Home, 
  Library, 
  PlusSquare, 
  Heart,
  Music,
  Github,
  Loader2,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Song, RepeatMode } from './types';
import { fetchSongsFromGithub } from './services/githubService';

// Default configuration - can be overridden by env vars
const DEFAULT_OWNER = import.meta.env.VITE_GITHUB_OWNER || 'VTQIT';
const DEFAULT_REPO = import.meta.env.VITE_GITHUB_REPO || 'Musify-V1';
const DEFAULT_PATH = import.meta.env.VITE_GITHUB_PATH || 'music';

export default function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffle, setIsShuffle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const currentSong = currentSongIndex !== null ? songs[currentSongIndex] : null;

  // Fetch songs on mount
  useEffect(() => {
    async function loadSongs() {
      setLoading(true);
      try {
        const fetchedSongs = await fetchSongsFromGithub(DEFAULT_OWNER, DEFAULT_REPO, DEFAULT_PATH);
        if (fetchedSongs.length === 0) {
          setError('No audio files found in the specified repository.');
        }
        setSongs(fetchedSongs);
        
        // Restore last played song from localStorage
        const lastPlayedId = localStorage.getItem('lastPlayedSongId');
        if (lastPlayedId) {
          const index = fetchedSongs.findIndex(s => s.id === lastPlayedId);
          if (index !== -1) {
            setCurrentSongIndex(index);
          }
        }
      } catch (err) {
        setError('Failed to connect to GitHub. Please check your configuration.');
      } finally {
        setLoading(false);
      }
    }
    loadSongs();
  }, []);

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error("Playback failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSongIndex]);

  // Save last played to localStorage
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('lastPlayedSongId', currentSong.id);
    }
  }, [currentSong]);

  const filteredSongs = useMemo(() => {
    return songs.filter(song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [songs, searchQuery]);

  const handlePlayPause = () => {
    if (currentSongIndex === null && songs.length > 0) {
      setCurrentSongIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songs.length);
    } else {
      nextIndex = currentSongIndex !== null ? (currentSongIndex + 1) % songs.length : 0;
    }
    setCurrentSongIndex(nextIndex);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (songs.length === 0) return;
    
    let prevIndex;
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * songs.length);
    } else {
      prevIndex = currentSongIndex !== null ? (currentSongIndex - 1 + songs.length) % songs.length : 0;
    }
    setCurrentSongIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (repeatMode === 'all' || currentSongIndex !== songs.length - 1 || isShuffle) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-black flex-shrink-0 flex flex-col p-6 space-y-8 hidden md:flex border-r border-white/10">
        <div className="flex items-center space-x-2 text-white">
          <Music className="w-8 h-8 text-emerald-500" />
          <span className="text-2xl font-bold tracking-tight">Gitify</span>
        </div>

        <nav className="space-y-4">
          <a href="#" className="flex items-center space-x-4 text-gray-400 hover:text-white transition-colors group">
            <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Home</span>
          </a>
          <a href="#" className="flex items-center space-x-4 text-gray-400 hover:text-white transition-colors group">
            <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Search</span>
          </a>
          <a href="#" className="flex items-center space-x-4 text-gray-400 hover:text-white transition-colors group">
            <Library className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Your Library</span>
          </a>
        </nav>

        <div className="space-y-4 pt-4">
          <button className="flex items-center space-x-4 text-gray-400 hover:text-white transition-colors w-full group">
            <div className="bg-gray-400 group-hover:bg-white p-1 rounded-sm transition-colors">
              <PlusSquare className="w-5 h-5 text-black" />
            </div>
            <span className="font-semibold">Create Playlist</span>
          </button>
          <button className="flex items-center space-x-4 text-gray-400 hover:text-white transition-colors w-full group">
            <div className="bg-gradient-to-br from-indigo-700 to-blue-300 p-1 rounded-sm">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-semibold">Liked Songs</span>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto border-t border-white/10 pt-4">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-4">Source</div>
          <div className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white cursor-pointer">
            <Github className="w-4 h-4" />
            <span className="truncate">{DEFAULT_OWNER}/{DEFAULT_REPO}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow flex flex-col bg-gradient-to-b from-zinc-900 to-black overflow-y-auto relative">
        {/* Header */}
        <header className="sticky top-0 z-10 p-4 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
          <div className="flex items-center space-x-4 flex-grow max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search songs..." 
                className="w-full bg-white/10 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white text-black font-bold py-2 px-6 rounded-full text-sm hover:scale-105 transition-transform">
              Upgrade
            </button>
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
              <span className="text-xs font-bold">U</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 pb-32">
          <div className="flex flex-col md:flex-row items-end space-y-6 md:space-y-0 md:space-x-6 mb-8">
            <div className="w-48 h-48 md:w-60 md:h-60 shadow-2xl rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center">
              {currentSong ? (
                <img 
                  src={currentSong.coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Music className="w-20 h-20 text-zinc-700" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Playlist</span>
              <h1 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter">GitHub Audio</h1>
              <div className="flex items-center space-x-2 text-sm font-medium">
                <Github className="w-5 h-5 text-emerald-500" />
                <span className="hover:underline cursor-pointer">{DEFAULT_OWNER}</span>
                <span className="text-gray-400">•</span>
                <span>{songs.length} songs</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-8 mb-8">
            <button 
              onClick={handlePlayPause}
              className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="w-6 h-6 text-black fill-black" /> : <Play className="w-6 h-6 text-black fill-black ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Heart className="w-8 h-8" />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-8 h-8" />
            </button>
          </div>

          {/* Song List */}
          <div className="w-full">
            <div className="grid grid-cols-[16px_1fr_1fr_48px] gap-4 px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-white/10 mb-4">
              <span>#</span>
              <span>Title</span>
              <span className="hidden md:block">Album</span>
              <span className="flex justify-end"><Clock className="w-4 h-4" /></span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
                <p className="text-gray-400 font-medium">Fetching tracks from GitHub...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <p className="text-red-400 font-medium">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white text-black font-bold py-2 px-6 rounded-full text-sm"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredSongs.map((song, index) => (
                  <div 
                    key={song.id}
                    onClick={() => {
                      setCurrentSongIndex(songs.findIndex(s => s.id === song.id));
                      setIsPlaying(true);
                    }}
                    className={`grid grid-cols-[16px_1fr_1fr_48px] gap-4 px-4 py-3 rounded-md transition-colors cursor-pointer group ${
                      currentSong?.id === song.id ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {currentSong?.id === song.id && isPlaying ? (
                        <div className="flex items-end space-x-0.5 h-3">
                          <div className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite]" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite]" style={{ animationDelay: '0.3s' }}></div>
                          <div className="w-0.5 bg-emerald-500 animate-[bounce_1s_infinite]" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <span className={`text-sm ${currentSong?.id === song.id ? 'text-emerald-500' : 'text-gray-400 group-hover:hidden'}`}>
                          {index + 1}
                        </span>
                      )}
                      <Play className={`w-3 h-3 text-white fill-white hidden group-hover:block ${currentSong?.id === song.id ? 'text-emerald-500 fill-emerald-500' : ''}`} />
                    </div>
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <img 
                        src={song.coverUrl} 
                        alt="" 
                        className="w-10 h-10 rounded flex-shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col truncate">
                        <span className={`text-sm font-medium truncate ${currentSong?.id === song.id ? 'text-emerald-500' : 'text-white'}`}>
                          {song.title}
                        </span>
                        <span className="text-xs text-gray-400 truncate group-hover:text-white transition-colors">
                          {song.artist}
                        </span>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center text-sm text-gray-400 group-hover:text-white transition-colors truncate">
                      GitHub Repository
                    </div>
                    <div className="flex items-center justify-end text-sm text-gray-400 group-hover:text-white transition-colors">
                      --:--
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Player Bar */}
      <footer className="fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-white/10 px-4 flex items-center justify-between z-20">
        {/* Current Song Info */}
        <div className="flex items-center space-x-4 w-1/3 min-w-0">
          {currentSong && (
            <>
              <motion.div 
                layoutId="player-cover"
                className="w-14 h-14 rounded overflow-hidden flex-shrink-0 shadow-lg"
              >
                <img 
                  src={currentSong.coverUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
              <div className="flex flex-col truncate">
                <span className="text-sm font-medium text-white hover:underline cursor-pointer truncate">
                  {currentSong.title}
                </span>
                <span className="text-xs text-gray-400 hover:text-white hover:underline cursor-pointer truncate">
                  {currentSong.artist}
                </span>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors flex-shrink-0">
                <Heart className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-2 w-1/3 max-w-xl">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setIsShuffle(!isShuffle)}
              className={`transition-colors ${isShuffle ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>
            <button 
              onClick={handlePrev}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button 
              onClick={handlePlayPause}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 text-black fill-black" /> : <Play className="w-5 h-5 text-black fill-black ml-0.5" />}
            </button>
            <button 
              onClick={handleNext}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button 
              onClick={() => {
                if (repeatMode === 'none') setRepeatMode('all');
                else if (repeatMode === 'all') setRepeatMode('one');
                else setRepeatMode('none');
              }}
              className={`relative transition-colors ${repeatMode !== 'none' ? 'text-emerald-500' : 'text-gray-400 hover:text-white'}`}
            >
              <Repeat className="w-5 h-5" />
              {repeatMode === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-emerald-500 text-black rounded-full w-3 h-3 flex items-center justify-center">1</span>}
            </button>
          </div>

          <div className="flex items-center space-x-2 w-full">
            <span className="text-[10px] text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="flex-grow h-1 bg-zinc-800 rounded-full cursor-pointer group relative"
            >
              <div 
                className="absolute top-0 left-0 h-full bg-white group-hover:bg-emerald-500 rounded-full transition-colors"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md hidden group-hover:block"></div>
              </div>
            </div>
            <span className="text-[10px] text-gray-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Extra */}
        <div className="flex items-center justify-end space-x-3 w-1/3">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Library className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 w-32">
            <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white hover:accent-emerald-500 transition-all"
            />
          </div>
        </div>
      </footer>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={currentSong?.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="auto"
      />

      <style>{`
        @keyframes bounce {
          0%, 100% { height: 3px; }
          50% { height: 12px; }
        }
        
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          width: 0;
          height: 0;
        }
        
        .group:hover input[type='range']::-webkit-slider-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
