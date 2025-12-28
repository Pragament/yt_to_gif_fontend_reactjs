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
  videoDimensions,
  onLinePositionUpdate,
  onLineAdd,
  cropMethod
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

  // Line dragging state
  const [draggingLineType, setDraggingLineType] = useState(null);
  const [draggingLineIndex, setDraggingLineIndex] = useState(null);
  const [draggingLinePart, setDraggingLinePart] = useState(null); // 'position', 'start', 'end'
  
  // New line creation state
  const [creatingLine, setCreatingLine] = useState(false);
  const [newLineStart, setNewLineStart] = useState(null);
  const [newLinePreview, setNewLinePreview] = useState(null);
  const [newLineType, setNewLineType] = useState(null);

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
    if (e.button !== 0) return;

    // Check if clicking on a line (for line-based cropping)
    if (cropMethod === 'lines' && lineOverlays && videoBounds.width > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left - videoBounds.x;
      const clickY = e.clientY - rect.top - videoBounds.y;
      const videoClickX = (clickX / videoBounds.scaleX);
      const videoClickY = (clickY / videoBounds.scaleY);

      // Check horizontal lines - prioritize endpoints
      if (lineOverlays.horizontal) {
        for (let i = 0; i < lineOverlays.horizontal.length; i++) {
          const line = lineOverlays.horizontal[i];
          const lineY = (typeof line === 'number' ? line : line.y) * videoBounds.scaleY;
          const lineX1 = (typeof line === 'number' ? 0 : (line.x1 || 0)) * videoBounds.scaleX;
          const lineX2 = (typeof line === 'number' ? videoDimensions.width : (line.x2 || videoDimensions.width)) * videoBounds.scaleX;
          
          // Check endpoints first with larger hit area
          const endpointHitArea = 12;
          const lineHitArea = 10;
          
          if (Math.abs(clickY - lineY) < endpointHitArea) {
            // Check if clicking on start endpoint - prioritize
            if (Math.abs(clickX - lineX1) < endpointHitArea) {
              setDraggingLineType('horizontal');
              setDraggingLineIndex(i);
              setDraggingLinePart('start');
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            // Check if clicking on end endpoint - prioritize
            if (Math.abs(clickX - lineX2) < endpointHitArea) {
              setDraggingLineType('horizontal');
              setDraggingLineIndex(i);
              setDraggingLinePart('end');
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            // Check if clicking on line body (to move position)
            if (clickX >= lineX1 && clickX <= lineX2) {
              setDraggingLineType('horizontal');
              setDraggingLineIndex(i);
              setDraggingLinePart('position');
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
        }
      }

      // Check vertical lines - prioritize endpoints
      if (lineOverlays.vertical) {
        for (let i = 0; i < lineOverlays.vertical.length; i++) {
          const line = lineOverlays.vertical[i];
          const lineX = (typeof line === 'number' ? line : line.x) * videoBounds.scaleX;
          const lineY1 = (typeof line === 'number' ? 0 : (line.y1 || 0)) * videoBounds.scaleY;
          const lineY2 = (typeof line === 'number' ? videoDimensions.height : (line.y2 || videoDimensions.height)) * videoBounds.scaleY;
          
          // Check endpoints first with larger hit area
          const endpointHitArea = 12;
          const lineHitArea = 10;
          
          // Check if clicking on start endpoint (top) - prioritize
          if (Math.abs(clickX - lineX) < endpointHitArea && Math.abs(clickY - lineY1) < endpointHitArea) {
            setDraggingLineType('vertical');
            setDraggingLineIndex(i);
            setDraggingLinePart('start');
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // Check if clicking on end endpoint (bottom) - prioritize
          if (Math.abs(clickX - lineX) < endpointHitArea && Math.abs(clickY - lineY2) < endpointHitArea) {
            setDraggingLineType('vertical');
            setDraggingLineIndex(i);
            setDraggingLinePart('end');
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          // Check if clicking on line body (to move position)
          if (Math.abs(clickX - lineX) < lineHitArea && clickY >= lineY1 && clickY <= lineY2) {
            setDraggingLineType('vertical');
            setDraggingLineIndex(i);
            setDraggingLinePart('position');
            e.preventDefault();
            e.stopPropagation();
            return;
          }
        }
      }

      // If not clicking on existing line, start creating a new line
      if (onLineAdd) {
        const start = screenToVideoCoords(e.clientX, e.clientY);
        setNewLineStart(start);
        setCreatingLine(true);
        setNewLinePreview({ ...start });
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    // Drag-based cropping
    if (dragEnabled) {
      const start = screenToVideoCoords(e.clientX, e.clientY);
      setDragStart(start);
      setCurrentDrag({ ...start, width: 0, height: 0 });
      setIsDragging(true);
    }
  };

  const handleMouseMove = e => {
    // Handle line dragging (existing lines)
    if (draggingLineType && draggingLineIndex !== null && draggingLinePart && onLinePositionUpdate) {
      const videoCoords = screenToVideoCoords(e.clientX, e.clientY);
      
      if (draggingLineType === 'horizontal') {
        if (draggingLinePart === 'position') {
          // Move line vertically
          const newY = Math.max(0, Math.min(videoDimensions.height, videoCoords.y));
          onLinePositionUpdate('horizontal', draggingLineIndex, { y: newY });
        } else if (draggingLinePart === 'start') {
          // Adjust left endpoint
          const newX1 = Math.max(0, Math.min(videoDimensions.width, videoCoords.x));
          onLinePositionUpdate('horizontal', draggingLineIndex, { x1: newX1 });
        } else if (draggingLinePart === 'end') {
          // Adjust right endpoint
          const newX2 = Math.max(0, Math.min(videoDimensions.width, videoCoords.x));
          onLinePositionUpdate('horizontal', draggingLineIndex, { x2: newX2 });
        }
      } else if (draggingLineType === 'vertical') {
        if (draggingLinePart === 'position') {
          // Move line horizontally
          const newX = Math.max(0, Math.min(videoDimensions.width, videoCoords.x));
          onLinePositionUpdate('vertical', draggingLineIndex, { x: newX });
        } else if (draggingLinePart === 'start') {
          // Adjust top endpoint
          const newY1 = Math.max(0, Math.min(videoDimensions.height, videoCoords.y));
          onLinePositionUpdate('vertical', draggingLineIndex, { y1: newY1 });
        } else if (draggingLinePart === 'end') {
          // Adjust bottom endpoint
          const newY2 = Math.max(0, Math.min(videoDimensions.height, videoCoords.y));
          onLinePositionUpdate('vertical', draggingLineIndex, { y2: newY2 });
        }
      }
      return;
    }

    // Handle new line creation
    if (creatingLine && newLineStart) {
      const current = screenToVideoCoords(e.clientX, e.clientY);
      const deltaX = Math.abs(current.x - newLineStart.x);
      const deltaY = Math.abs(current.y - newLineStart.y);
      
      // Determine line type based on drag direction (more horizontal = horizontal line, more vertical = vertical line)
      if (deltaX > 20 || deltaY > 20) {
        if (deltaX > deltaY) {
          // More horizontal movement = create horizontal line segment
          // Use start Y position for the line, drag X for endpoints
          setNewLineType('horizontal');
          setNewLinePreview({ 
            y: newLineStart.y,
            x1: Math.min(newLineStart.x, current.x),
            x2: Math.max(newLineStart.x, current.x)
          });
        } else {
          // More vertical movement = create vertical line segment
          // Use start X position for the line, drag Y for endpoints
          setNewLineType('vertical');
          setNewLinePreview({ 
            x: newLineStart.x,
            y1: Math.min(newLineStart.y, current.y),
            y2: Math.max(newLineStart.y, current.y)
          });
        }
      } else {
        // Not enough movement yet, keep preview at start position
        setNewLinePreview({ ...newLineStart });
      }
      return;
    }

    // Drag-based cropping
    if (isDragging && dragStart) {
      const current = screenToVideoCoords(e.clientX, e.clientY);

      setCurrentDrag({
        x: Math.min(dragStart.x, current.x),
        y: Math.min(dragStart.y, current.y),
        width: Math.abs(current.x - dragStart.x),
        height: Math.abs(current.y - dragStart.y)
      });
    }
  };

  const handleMouseUp = () => {
    // End line dragging (existing lines)
    if (draggingLineType !== null) {
      setDraggingLineType(null);
      setDraggingLineIndex(null);
      setDraggingLinePart(null);
      return;
    }

    // Finish creating new line
    if (creatingLine && newLinePreview && newLineType && onLineAdd) {
      if (newLineType === 'horizontal' && newLinePreview.y !== undefined && newLinePreview.x1 !== undefined && newLinePreview.x2 !== undefined) {
        const y = Math.max(0, Math.min(videoDimensions.height, newLinePreview.y));
        const x1 = Math.max(0, Math.min(videoDimensions.width, newLinePreview.x1));
        const x2 = Math.max(0, Math.min(videoDimensions.width, newLinePreview.x2));
        // Ensure x2 > x1 (minimum line length of 10px)
        if (Math.abs(x2 - x1) >= 10) {
          onLineAdd('horizontal', { y, x1: Math.min(x1, x2), x2: Math.max(x1, x2) });
        }
      } else if (newLineType === 'vertical' && newLinePreview.x !== undefined && newLinePreview.y1 !== undefined && newLinePreview.y2 !== undefined) {
        const x = Math.max(0, Math.min(videoDimensions.width, newLinePreview.x));
        const y1 = Math.max(0, Math.min(videoDimensions.height, newLinePreview.y1));
        const y2 = Math.max(0, Math.min(videoDimensions.height, newLinePreview.y2));
        // Ensure y2 > y1 (minimum line length of 10px)
        if (Math.abs(y2 - y1) >= 10) {
          onLineAdd('vertical', { x, y1: Math.min(y1, y2), y2: Math.max(y1, y2) });
        }
      }
      
      setCreatingLine(false);
      setNewLineStart(null);
      setNewLinePreview(null);
      setNewLineType(null);
      return;
    }

    // Cancel line creation if not enough movement
    if (creatingLine) {
      setCreatingLine(false);
      setNewLineStart(null);
      setNewLinePreview(null);
      setNewLineType(null);
      return;
    }

    // Drag-based cropping
    if (isDragging && currentDrag?.width > 10 && currentDrag?.height > 10) {
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


      <div
        ref={containerRef}
        className={`video-container ${dragEnabled ? 'drag-enabled' : ''} ${cropMethod === 'lines' ? 'lines-enabled' : ''}`}
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
          {cropMethod === 'lines' && lineOverlays && videoBounds.width > 0 && videoBounds.height > 0 && (
            <div
              className="line-overlays"
              style={{
                left: videoBounds.x,
                top: videoBounds.y,
                width: videoBounds.width,
                height: videoBounds.height
              }}
            >
              {lineOverlays.horizontal?.map((line, i) => {
                const lineData = typeof line === 'number' ? { y: line, x1: 0, x2: videoDimensions.width } : line;
                const isDragging = draggingLineIndex === i && draggingLineType === 'horizontal';
                return (
                  <div key={`h-${i}`}>
                    <div
                      className={`overlay-line horizontal-line ${isDragging ? 'dragging' : ''}`}
                      style={{ 
                        top: lineData.y * videoBounds.scaleY,
                        left: lineData.x1 * videoBounds.scaleX,
                        width: (lineData.x2 - lineData.x1) * videoBounds.scaleX,
                        cursor: isDragging && draggingLinePart === 'position' ? 'ns-resize' : 'default'
                      }}
                    />
                    {/* Start endpoint */}
                    <div
                      className={`line-endpoint line-endpoint-start ${isDragging && draggingLinePart === 'start' ? 'dragging' : ''}`}
                      style={{
                        left: lineData.x1 * videoBounds.scaleX - 5,
                        top: lineData.y * videoBounds.scaleY - 5,
                        cursor: 'ew-resize',
                        zIndex: 20
                      }}
                    />
                    {/* End endpoint */}
                    <div
                      className={`line-endpoint line-endpoint-end ${isDragging && draggingLinePart === 'end' ? 'dragging' : ''}`}
                      style={{
                        left: lineData.x2 * videoBounds.scaleX - 5,
                        top: lineData.y * videoBounds.scaleY - 5,
                        cursor: 'ew-resize',
                        zIndex: 20
                      }}
                    />
                  </div>
                );
              })}
              {lineOverlays.vertical?.map((line, i) => {
                const lineData = typeof line === 'number' ? { x: line, y1: 0, y2: videoDimensions.height } : line;
                const isDragging = draggingLineIndex === i && draggingLineType === 'vertical';
                return (
                  <div key={`v-${i}`}>
                    <div
                      className={`overlay-line vertical-line ${isDragging ? 'dragging' : ''}`}
                      style={{ 
                        left: lineData.x * videoBounds.scaleX,
                        top: lineData.y1 * videoBounds.scaleY,
                        height: (lineData.y2 - lineData.y1) * videoBounds.scaleY,
                        cursor: isDragging && draggingLinePart === 'position' ? 'ew-resize' : 'default'
                      }}
                    />
                    {/* Start endpoint (top) */}
                    <div
                      className={`line-endpoint line-endpoint-start ${isDragging && draggingLinePart === 'start' ? 'dragging' : ''}`}
                      style={{
                        left: lineData.x * videoBounds.scaleX - 5,
                        top: Math.max(lineData.y1 * videoBounds.scaleY - 5, -5),
                        cursor: 'ns-resize',
                        zIndex: 25,
                        position: 'absolute'
                      }}
                    />
                    {/* End endpoint (bottom) */}
                    <div
                      className={`line-endpoint line-endpoint-end ${isDragging && draggingLinePart === 'end' ? 'dragging' : ''}`}
                      style={{
                        left: lineData.x * videoBounds.scaleX - 5,
                        top: Math.min(lineData.y2 * videoBounds.scaleY - 5, videoBounds.height - 10),
                        cursor: 'ns-resize',
                        zIndex: 25,
                        position: 'absolute'
                      }}
                    />
                  </div>
                );
              })}
              
              {/* Preview line while creating new line */}
              {creatingLine && newLinePreview && newLineType && (
                <>
                  {newLineType === 'horizontal' && newLinePreview.y !== undefined && (
                    <>
                      <div
                        className="overlay-line horizontal-line creating"
                        style={{ 
                          top: newLinePreview.y * videoBounds.scaleY,
                          left: (newLinePreview.x1 || 0) * videoBounds.scaleX,
                          width: ((newLinePreview.x2 || videoDimensions.width) - (newLinePreview.x1 || 0)) * videoBounds.scaleX,
                        }}
                      />
                      <div
                        className="line-endpoint line-endpoint-start creating"
                        style={{
                          left: (newLinePreview.x1 || 0) * videoBounds.scaleX - 4,
                          top: newLinePreview.y * videoBounds.scaleY - 4,
                        }}
                      />
                      <div
                        className="line-endpoint line-endpoint-end creating"
                        style={{
                          left: (newLinePreview.x2 || videoDimensions.width) * videoBounds.scaleX - 4,
                          top: newLinePreview.y * videoBounds.scaleY - 4,
                        }}
                      />
                    </>
                  )}
                  {newLineType === 'vertical' && newLinePreview.x !== undefined && (
                    <>
                      <div
                        className="overlay-line vertical-line creating"
                        style={{ 
                          left: newLinePreview.x * videoBounds.scaleX,
                          top: (newLinePreview.y1 || 0) * videoBounds.scaleY,
                          height: ((newLinePreview.y2 || videoDimensions.height) - (newLinePreview.y1 || 0)) * videoBounds.scaleY,
                        }}
                      />
                      <div
                        className="line-endpoint line-endpoint-start creating"
                        style={{
                          left: newLinePreview.x * videoBounds.scaleX - 4,
                          top: (newLinePreview.y1 || 0) * videoBounds.scaleY - 4,
                        }}
                      />
                      <div
                        className="line-endpoint line-endpoint-end creating"
                        style={{
                          left: newLinePreview.x * videoBounds.scaleX - 4,
                          top: (newLinePreview.y2 || videoDimensions.height) * videoBounds.scaleY - 4,
                        }}
                      />
                    </>
                  )}
                </>
              )}
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
