import React, { useRef, useEffect, useState, memo } from 'react';
import ReactPlayer from 'react-player';
import './VideoPreview.css';

function VideoPreviewComponent({
  videoUrl,
  videoStatus,
  onDimensionsChange,
  lineOverlays,
  dragEnabled = false,
  dragRegions = [],
  onDragRegionsChange,
  videoDimensions
}) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const videoElementRef = useRef(null);

  const [videoBounds, setVideoBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [currentDrag, setCurrentDrag] = useState(null);

  const boundsInitializedRef = useRef(false);

  /* =========================================
     Capture video element + natural dimensions
  ========================================= */
  useEffect(() => {
    if (!videoUrl || !playerRef.current) return;

    const detectVideo = () => {
      const player = playerRef.current.getInternalPlayer();
      const video =
        player?.tagName === 'VIDEO'
          ? player
          : player?.querySelector?.('video');

      if (video && video.videoWidth && video.videoHeight) {
        videoElementRef.current = video;
        onDimensionsChange({
          width: video.videoWidth,
          height: video.videoHeight
        });
      }
    };

    detectVideo();

    const observer = new MutationObserver(detectVideo);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true
      });
    }

    return () => observer.disconnect();
  }, [videoUrl, onDimensionsChange]);

  /* =========================================
     Calculate rendered video bounds (ONCE)
  ========================================= */
  const calculateVideoBounds = () => {
    if (!containerRef.current || !videoDimensions.width || !videoDimensions.height) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const videoRect = videoElementRef.current?.getBoundingClientRect();

    let x, y, width, height;

    if (videoRect?.width && videoRect?.height) {
      x = videoRect.left - containerRect.left;
      y = videoRect.top - containerRect.top;
      width = videoRect.width;
      height = videoRect.height;
    } else {
      const videoAspect = videoDimensions.width / videoDimensions.height;
      const containerAspect = containerRect.width / containerRect.height;

      if (videoAspect > containerAspect) {
        width = containerRect.width;
        height = width / videoAspect;
        x = 0;
        y = (containerRect.height - height) / 2;
      } else {
        height = containerRect.height;
        width = height * videoAspect;
        x = (containerRect.width - width) / 2;
        y = 0;
      }
    }

    const scaleX = width / videoDimensions.width;
    const scaleY = height / videoDimensions.height;

    setVideoBounds({
      x,
      y,
      width,
      height,
      scaleX,
      scaleY
    });

    boundsInitializedRef.current = true;
  };

  useEffect(() => {
    if (!videoUrl || !videoDimensions.width || !videoDimensions.height) {
      boundsInitializedRef.current = false;
      return;
    }

    setTimeout(calculateVideoBounds, 200);
    window.addEventListener('resize', calculateVideoBounds);

    return () => window.removeEventListener('resize', calculateVideoBounds);
  }, [videoUrl, videoDimensions.width, videoDimensions.height]);

  /* =========================================
     Coordinate conversion (screen → video px)
  ========================================= */
  const screenToVideoCoords = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();

    const x =
      (clientX - rect.left - videoBounds.x) / videoBounds.scaleX;
    const y =
      (clientY - rect.top - videoBounds.y) / videoBounds.scaleY;

    return {
      x: Math.max(0, Math.min(videoDimensions.width, x)),
      y: Math.max(0, Math.min(videoDimensions.height, y))
    };
  };

  /* =========================================
     Drag handlers
  ========================================= */
  const handleMouseDown = e => {
    if (!dragEnabled || e.button !== 0) return;

    const start = screenToVideoCoords(e.clientX, e.clientY);
    setDragStart(start);
    setCurrentDrag({ ...start, width: 0, height: 0 });
    setIsDragging(true);
  };

  const handleMouseMove = e => {
    if (!isDragging || !dragStart) return;

    const current = screenToVideoCoords(e.clientX, e.clientY);

    setCurrentDrag({
      x: Math.min(dragStart.x, current.x),
      y: Math.min(dragStart.y, current.y),
      width: Math.abs(current.x - dragStart.x),
      height: Math.abs(current.y - dragStart.y)
    });
  };

  const handleMouseUp = () => {
    if (currentDrag?.width > 10 && currentDrag?.height > 10) {
      onDragRegionsChange?.([
        ...dragRegions,
        {
          x: Math.round(currentDrag.x),
          y: Math.round(currentDrag.y),
          width: Math.round(currentDrag.width),
          height: Math.round(currentDrag.height)
        }
      ]);
    }

    setIsDragging(false);
    setDragStart(null);
    setCurrentDrag(null);
  };

  const removeDragRegion = index =>
    onDragRegionsChange?.(dragRegions.filter((_, i) => i !== index));

  /* =========================================
     Placeholder
  ========================================= */
  if (!videoUrl || videoStatus?.status !== 'ready') {
    return (
      <div className="card video-preview-placeholder">
        <h2>Video Preview</h2>
        <div className="placeholder-content">
          <p>Download or upload a video to see preview</p>
        </div>
      </div>
    );
  }

  /* =========================================
     Render
  ========================================= */
  return (
    <div className="card video-preview">
      <h2>Video Preview</h2>

      {/* Floating instructions (NO layout shift) */}
      {dragEnabled && (
        <div className="drag-instructions-overlay">
          Click and drag on the video to create crop regions.
        </div>
      )}

      <div
        ref={containerRef}
        className={`video-container ${dragEnabled ? 'drag-enabled' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="video-overlay-wrapper">
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            controls
            width="100%"
            height="100%"
          />

          {/* Line-based cropping */}
          {!dragEnabled && lineOverlays && (
            <div
              className="line-overlays"
              style={{
                left: videoBounds.x,
                top: videoBounds.y,
                width: videoBounds.width,
                height: videoBounds.height
              }}
            >
              {lineOverlays.horizontal?.map((y, i) => (
                <div
                  key={`h-${i}`}
                  className="overlay-line horizontal-line"
                  style={{ top: y }}
                />
              ))}
              {lineOverlays.vertical?.map((x, i) => (
                <div
                  key={`v-${i}`}
                  className="overlay-line vertical-line"
                  style={{ left: x }}
                />
              ))}
            </div>
          )}

          {/* Drag-based cropping */}
          {dragEnabled && (
            <div
              className="drag-overlays"
              style={{
                left: videoBounds.x,
                top: videoBounds.y,
                width: videoBounds.width,
                height: videoBounds.height
              }}
            >
              {dragRegions.map((r, i) => (
                <div
                  key={i}
                  className="drag-region"
                  style={{
                    left: r.x * videoBounds.scaleX,
                    top: r.y * videoBounds.scaleY,
                    width: r.width * videoBounds.scaleX,
                    height: r.height * videoBounds.scaleY
                  }}
                  onContextMenu={e => {
                    e.preventDefault();
                    removeDragRegion(i);
                  }}
                >
                  <div className="drag-region-label">{i + 1}</div>
                </div>
              ))}

              {isDragging && currentDrag && (
                <div
                  className="drag-region dragging"
                  style={{
                    left: currentDrag.x * videoBounds.scaleX,
                    top: currentDrag.y * videoBounds.scaleY,
                    width: currentDrag.width * videoBounds.scaleX,
                    height: currentDrag.height * videoBounds.scaleY
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(VideoPreviewComponent);
