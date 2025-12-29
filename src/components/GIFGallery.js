import React from 'react';
import { getGIFUrl } from '../services/gifService';
import './GIFGallery.css';

function GIFGallery({ gifTasks, onClearGIFs }) {
  const tasks = Object.values(gifTasks || {});
  
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all GIFs? This action cannot be undone.')) {
      onClearGIFs();
    }
  };
  
  if (tasks.length === 0) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#28a745';
      case 'processing':
        return '#007bff';
      case 'failed':
        return '#dc3545';
      case 'waiting':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const handleDownload = (gifId, filename) => {
    const url = getGIFUrl(gifId);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card gallery">
      <div className="gallery-header">
        <h2>Generated GIFs</h2>
        <button
          className="button button-secondary clear-button"
          onClick={handleClear}
        >
          Clear GIFs
        </button>
      </div>
      <div className="gallery-grid">
        {tasks.map((task) => (
          <div key={task.gif_id} className="gallery-item">
            <div className="gallery-item-header">
              <span className="gallery-item-filename">{task.filename}</span>
              <span
                className="gallery-item-status"
                style={{ color: getStatusColor(task.status) }}
              >
                {task.status}
              </span>
            </div>
            
            {task.status === 'processing' && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${task.progress || 0}%` }}
                  ></div>
                </div>
                <div className="progress-label">{Math.round(task.progress || 0)}%</div>
              </div>
            )}
            
            {task.status === 'completed' && task.gif_path && (
              <div className="gallery-item-preview">
                <img
                  src={getGIFUrl(task.gif_id)}
                  alt={task.filename}
                  className="gif-preview"
                />
                <button
                  className="button download-button"
                  onClick={() => handleDownload(task.gif_id, task.filename)}
                >
                  Download
                </button>
              </div>
            )}
            
            {task.status === 'failed' && task.error && (
              <div className="error">Error: {task.error}</div>
            )}
            
            {task.status === 'waiting' && (
              <div className="waiting-message">Waiting to process...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GIFGallery;

