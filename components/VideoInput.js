import React, { useState } from 'react';
import './VideoInput.css';

function VideoInput({ onYouTubeDownload, onVideoUpload, videoStatus }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleYouTubeSubmit = (e) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      onYouTubeDownload(youtubeUrl);
      setYoutubeUrl('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onVideoUpload(file);
    }
  };

  const progress = videoStatus?.progress || 0;
  const status = videoStatus?.status;

  return (
    <div className="card">
      <h2>Video Input</h2>
      
      <div className="input-section">
        <h3>YouTube URL</h3>
        <form onSubmit={handleYouTubeSubmit}>
          <div className="input-group">
            <input
              type="url"
              placeholder="Enter YouTube URL (including Shorts)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={status === 'downloading' || status === 'uploading'}
            />
          </div>
          <button
            type="submit"
            className="button"
            disabled={!youtubeUrl.trim() || status === 'downloading' || status === 'uploading'}
          >
            Download Video
          </button>
        </form>
        
        {status === 'downloading' && (
          <div className="progress-container">
            <div className="progress-label">Downloading: {Math.round(progress)}%</div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        
        {status === 'error' && videoStatus.error && (
          <div className="error">Error: {videoStatus.error}</div>
        )}
      </div>
      
      <div className="divider">OR</div>
      
      <div className="input-section">
        <h3>Local Video Upload</h3>
        <div className="input-group">
          <input
            type="file"
            accept=".mp4,.mov,.webm"
            onChange={handleFileChange}
            disabled={status === 'downloading' || status === 'uploading'}
          />
        </div>
        
        {status === 'uploading' && (
          <div className="progress-container">
            <div className="progress-label">Uploading: {Math.round(progress)}%</div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
      </div>
      
      {status === 'ready' && (
        <div className="success">Video ready for processing!</div>
      )}
    </div>
  );
}

export default VideoInput;

