import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScatterPlot from './components/ScatterPlot';
import AlbumModal from './components/AlbumModal';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for tokens in URL
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');

    if (accessToken) {
      setIsLoggedIn(true);
      fetchSongs(accessToken);
      // Clean URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  const fetchSongs = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/songs?access_token=${token}`);
      setSongs(response.data);
    } catch (error) {
      console.error("Failed to fetch songs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = 'http://127.0.0.1:5000/login';
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
            <div className="flex items-center justify-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              <span className="ml-4 text-xl">Analyzing your library...</span>
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
