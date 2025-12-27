import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import VideoInput from './components/VideoInput';
import VideoPreview from './components/VideoPreview';
import CropConfig from './components/CropConfig';
import GIFGallery from './components/GIFGallery';
import { downloadVideo, uploadVideo, getVideoStatus, getVideoUrl } from './services/api';
import { processGIFs, getGIFStatus, clearGIFs } from './services/gifService';

function App() {
  const [videoId, setVideoId] = useState(null);
  const [videoStatus, setVideoStatus] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cropMethod, setCropMethod] = useState('grid');
  const [gifConfigs, setGifConfigs] = useState([]);
  const [gifTasks, setGifTasks] = useState({});
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [lineOverlays, setLineOverlays] = useState({ horizontal: [], vertical: [] });
  const [dragRegions, setDragRegions] = useState([]);
  const statusIntervalRef = useRef(null);
  const gifStatusIntervalRef = useRef(null);
  const isClearingRef = useRef(false);

  // Poll video status
  useEffect(() => {
    if (videoId) {
      const checkStatus = async () => {
        try {
          const status = await getVideoStatus(videoId);
          setVideoStatus(status);
          
          if (status.status === 'ready' && status.video_path) {
            const url = getVideoUrl(videoId);
            setVideoUrl(url);
            
            // Get video dimensions
            const video = document.createElement('video');
            video.src = url;
            video.onloadedmetadata = () => {
              setVideoDimensions({
                width: video.videoWidth,
                height: video.videoHeight
              });
            };
            
            if (statusIntervalRef.current) {
              clearInterval(statusIntervalRef.current);
              statusIntervalRef.current = null;
            }
          } else if (status.status === 'error') {
            if (statusIntervalRef.current) {
              clearInterval(statusIntervalRef.current);
              statusIntervalRef.current = null;
            }
          }
        } catch (error) {
          console.error('Error checking video status:', error);
        }
      };
      
      checkStatus();
      statusIntervalRef.current = setInterval(checkStatus, 1000);
    }
    
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, [videoId]);

  // Poll GIF status
  useEffect(() => {
    // Don't start polling if we're clearing or if there are no tasks
    if (!videoId || isClearingRef.current || Object.keys(gifTasks).length === 0) {
      return;
    }
    
    const checkGIFStatus = async () => {
      // Don't check if we're clearing
      if (isClearingRef.current) {
        return;
      }
      
      try {
        const status = await getGIFStatus(videoId);
        const newGifTasks = status.gif_tasks || {};
        
        // Don't update if we're clearing
        if (isClearingRef.current) {
          return;
        }
        
        // Only update if there are actually tasks
        if (Object.keys(newGifTasks).length > 0) {
          setGifTasks(newGifTasks);
          
          // Check if all tasks are completed or failed
          const allDone = Object.values(newGifTasks).every(
            task => task.status === 'completed' || task.status === 'failed'
          );
          
          if (allDone && gifStatusIntervalRef.current) {
            clearInterval(gifStatusIntervalRef.current);
            gifStatusIntervalRef.current = null;
          }
        } else {
          // Backend has no tasks, stop polling
          if (gifStatusIntervalRef.current) {
            clearInterval(gifStatusIntervalRef.current);
            gifStatusIntervalRef.current = null;
          }
          setGifTasks({});
        }
      } catch (error) {
        console.error('Error checking GIF status:', error);
      }
    };
    
    checkGIFStatus();
    gifStatusIntervalRef.current = setInterval(checkGIFStatus, 1000);
    
    return () => {
      if (gifStatusIntervalRef.current) {
        clearInterval(gifStatusIntervalRef.current);
        gifStatusIntervalRef.current = null;
      }
    };
  }, [videoId, gifTasks]);

  const handleYouTubeDownload = async (url) => {
    try {
      const result = await downloadVideo(url);
      setVideoId(result.video_id);
      setVideoStatus({ status: 'downloading', progress: 0 });
    } catch (error) {
      console.error('Error downloading video:', error);
      alert('Error downloading video: ' + error.message);
    }
  };

  const handleVideoUpload = async (file) => {
    try {
      const result = await uploadVideo(file);
      setVideoId(result.video_id);
      setVideoStatus({ status: 'uploading', progress: 0 });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video: ' + error.message);
    }
  };

  const handleProcessGIFs = async (configs, method, params) => {
    if (!videoId) {
      alert('Please download or upload a video first');
      return;
    }
    
    try {
      const result = await processGIFs(videoId, configs, method, params);
      setGifTasks(result.gif_tasks || {});
    } catch (error) {
      console.error('Error processing GIFs:', error);
      alert('Error processing GIFs: ' + error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>GIF Generator</h1>
        <p>Generate multiple GIFs from videos</p>
      </header>
      
      <div className="App-input-section">
        <VideoInput
          onYouTubeDownload={handleYouTubeDownload}
          onVideoUpload={handleVideoUpload}
          videoStatus={videoStatus}
        />
      </div>
      
      <div className="App-container">
        <div className="App-left">
          <VideoPreview
            videoUrl={videoUrl}
            videoStatus={videoStatus}
            onDimensionsChange={setVideoDimensions}
            lineOverlays={lineOverlays}
            dragEnabled={cropMethod === 'drag'}
            dragRegions={dragRegions}
            onDragRegionsChange={setDragRegions}
            videoDimensions={videoDimensions}
          />
        </div>
        
        <div className="App-right">
          <CropConfig
            cropMethod={cropMethod}
            onCropMethodChange={setCropMethod}
            videoDimensions={videoDimensions}
            gifConfigs={gifConfigs}
            onGifConfigsChange={setGifConfigs}
            onProcessGIFs={handleProcessGIFs}
            videoId={videoId}
            videoReady={videoStatus?.status === 'ready'}
            onLineOverlaysChange={setLineOverlays}
            dragRegions={dragRegions}
            onDragRegionsChange={setDragRegions}
          />
        </div>
      </div>
      
      <div className="App-gallery">
        <GIFGallery 
          gifTasks={gifTasks} 
          onClearGIFs={async () => {
            // Set clearing flag
            isClearingRef.current = true;
            
            // Stop polling immediately
            if (gifStatusIntervalRef.current) {
              clearInterval(gifStatusIntervalRef.current);
              gifStatusIntervalRef.current = null;
            }
            
            // Clear frontend state immediately
            setGifTasks({});
            
            // Clear backend
            if (videoId) {
              try {
                await clearGIFs(videoId);
              } catch (error) {
                console.error('Error clearing GIFs from backend:', error);
              }
            }
            
            // Reset clearing flag after a short delay
            setTimeout(() => {
              isClearingRef.current = false;
            }, 500);
          }}
        />
      </div>
    </div>
  );
}

export default App;

