import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScatterPlot from './components/ScatterPlot';
import AlbumModal from './components/AlbumModal';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [loadingProgress, setLoadingProgress] = useState({ stage: '', current: 0, total: 0 });

  useEffect(() => {
    // Check for tokens in URL
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');

    if (accessToken) {
      setIsLoggedIn(true);
      fetchSongsStream(accessToken);
      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const fetchSongsStream = (token) => {
    setLoading(true);
    setLoadingProgress({ stage: 'Connecting...', current: 0, total: 0 });

    const eventSource = new EventSource(`http://127.0.0.1:5000/api/songs-stream?access_token=${token}`);

    eventSource.onmessage = (event) => {
      // Keep alive or generic messages
    };

    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setLoadingProgress(data);
    });

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      setSongs(data);
      setLoading(false);
      eventSource.close();
    });

    eventSource.addEventListener('error', (event) => {
      const data = event.data ? JSON.parse(event.data) : { message: 'Connection error' };
      console.error("Stream error:", data);
      setLoading(false);
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setLoading(false);
      eventSource.close();
    };
  };

  const handleLogin = () => {
    window.location.href = 'http://127.0.0.1:5000/login';
  };

  const getProgressPercentage = () => {
    if (!loadingProgress.total) return 0;
    return Math.round((loadingProgress.current / loadingProgress.total) * 100);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white relative">
      {!isLoggedIn ? (
        <div className="flex flex-col items-center justify-center h-screen space-y-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Spotify Color Map
          </h1>
          <p className="text-zinc-400 text-xl max-w-md text-center">
            Visualize your music library as a universe of color.
          </p>
          <button
            onClick={handleLogin}
            className="px-8 py-4 bg-[#1DB954] text-black font-bold rounded-full hover:scale-105 transition-transform text-lg shadow-lg hover:shadow-green-500/20"
          >
            Connect with Spotify
          </button>
        </div>
      ) : (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-screen space-y-6">
              <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-green-400">
                  {getProgressPercentage()}%
                </div>
                <div className="text-zinc-400">
                  {loadingProgress.stage === 'fetching' ? 'Fetching songs...' : 'Analyzing colors...'}
                </div>
                <div className="text-sm text-zinc-600">
                  {loadingProgress.current} / {loadingProgress.total}
                </div>
              </div>
            </div>
          ) : (
            <ScatterPlot data={songs} onAlbumClick={setSelectedAlbum} />
          )}
        </>
      )}

      <AlbumModal
        album={selectedAlbum}
        onClose={() => setSelectedAlbum(null)}
      />
    </div>
  );
}

export default App;
