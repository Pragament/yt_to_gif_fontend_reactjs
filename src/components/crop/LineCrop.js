import React, { useEffect, useState } from 'react';

function LineCrop({
  horizontalLines,
  verticalLines,
  lineUnit,
  onParamsChange,
  videoDimensions,
  gifConfigs,
  onGifConfigsChange,
  onLineOverlaysChange,
  lineOverlays,
}) {
  const [hLineInput, setHLineInput] = useState('');
  const [vLineInput, setVLineInput] = useState('');

  // Sync line positions from dragged overlays back to params
  useEffect(() => {
    if (lineOverlays && videoDimensions.width > 0 && videoDimensions.height > 0) {
      // Check if lineOverlays have been updated (from dragging or adding)
      const currentHPixels = lineOverlays.horizontal || [];
      const currentVPixels = lineOverlays.vertical || [];
      
      // Extract positions from line objects (support both old number format and new object format)
      const extractHPositions = currentHPixels.map(v => typeof v === 'number' ? v : v.y);
      const extractVPositions = currentVPixels.map(v => typeof v === 'number' ? v : v.x);
      
      // Convert current overlay pixels to the current unit
      const currentHInUnit = lineUnit === 'percent'
        ? extractHPositions.map(v => (v / videoDimensions.height) * 100)
        : extractHPositions;
      const currentVInUnit = lineUnit === 'percent'
        ? extractVPositions.map(v => (v / videoDimensions.width) * 100)
        : extractVPositions;
      
      // Handle new lines being added (length increased)
      if (currentHInUnit.length > horizontalLines.length) {
        onParamsChange(prev => ({
          ...prev,
          horizontalLines: [...currentHInUnit].sort((a, b) => a - b)
        }));
      }
      if (currentVInUnit.length > verticalLines.length) {
        onParamsChange(prev => ({
          ...prev,
          verticalLines: [...currentVInUnit].sort((a, b) => a - b)
        }));
      }
      
      // Only update positions if lengths match (to avoid loops and floating point issues)
      const tolerance = 0.1;
      const sortedCurrentH = [...currentHInUnit].sort((a, b) => a - b);
      const sortedCurrentV = [...currentVInUnit].sort((a, b) => a - b);
      const sortedH = [...horizontalLines].sort((a, b) => a - b);
      const sortedV = [...verticalLines].sort((a, b) => a - b);
      
      const hChanged = sortedCurrentH.length === sortedH.length && 
                       sortedCurrentH.some((val, i) => Math.abs(val - sortedH[i]) > tolerance);
      const vChanged = sortedCurrentV.length === sortedV.length && 
                       sortedCurrentV.some((val, i) => Math.abs(val - sortedV[i]) > tolerance);
      
      if (hChanged && sortedCurrentH.length === sortedH.length) {
        onParamsChange(prev => ({
          ...prev,
          horizontalLines: sortedCurrentH
        }));
      }
      if (vChanged && sortedCurrentV.length === sortedV.length) {
        onParamsChange(prev => ({
          ...prev,
          verticalLines: sortedCurrentV
        }));
      }
    }
  }, [lineOverlays, lineUnit, videoDimensions, horizontalLines.length, verticalLines.length]);

  useEffect(() => {
    // Calculate number of regions
    const hRegions = horizontalLines.length + 1;
    const vRegions = verticalLines.length + 1;
    const totalRegions = hRegions * vRegions;
    
    // Auto-generate or update GIF configs
    const newConfigs = [];
    for (let i = 0; i < totalRegions; i++) {
      const hIdx = Math.floor(i / vRegions);
      const vIdx = i % vRegions;
      
      const existingConfig = gifConfigs[i];
      
      if (existingConfig) {
        newConfigs.push(existingConfig);
      } else {
        newConfigs.push({
          filename: `line_${hIdx}_${vIdx}.gif`,
          start_time: 0,
          duration: 5,
          fps: 15,
          scale: null,
          crop: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            unit: 'percent'
          }
        });
      }
    }
    
    // Update crop regions based on lines
    if (videoDimensions.width > 0 && videoDimensions.height > 0) {
      const maxHValue = lineUnit === 'percent' ? 100 : videoDimensions.height;
      const maxVValue = lineUnit === 'percent' ? 100 : videoDimensions.width;

      const sortedH = [...horizontalLines].sort((a, b) => a - b);
      const sortedV = [...verticalLines].sort((a, b) => a - b);
      const hPositions = [0, ...sortedH, maxHValue];
      const vPositions = [0, ...sortedV, maxVValue];

      // Update overlays in pixel space for the preview (only if not already set from dragging)
      if (onLineOverlaysChange && (!lineOverlays || 
          (lineOverlays.horizontal?.length !== sortedH.length || 
           lineOverlays.vertical?.length !== sortedV.length))) {
        // Preserve existing horizontal line endpoints when updating
        // Match by position (y value) rather than index, since lines are sorted
        const horizontalPixels = sortedH.map((v) => {
          const pixelY = lineUnit === 'percent'
            ? (v / 100) * videoDimensions.height
            : v;
          
          // Find existing line with matching y position
          if (lineOverlays?.horizontal) {
            const existing = lineOverlays.horizontal.find(line => {
              const existingY = typeof line === 'number' ? line : line.y;
              return Math.abs(existingY - pixelY) < 0.1; // Small tolerance for floating point
            });
            
            if (existing && typeof existing === 'object') {
              // Preserve existing endpoints
              return { y: pixelY, x1: existing.x1 || 0, x2: existing.x2 || videoDimensions.width };
            }
          }
          
          // Default endpoints for new lines
          return { y: pixelY, x1: 0, x2: videoDimensions.width };
        });
        
        // Preserve existing vertical line endpoints when updating
        // Match by position (x value) rather than index, since lines are sorted
        const verticalPixels = sortedV.map((v) => {
          const pixelX = lineUnit === 'percent' 
            ? (v / 100) * videoDimensions.width 
            : v;
          
          // Find existing line with matching x position
          if (lineOverlays?.vertical) {
            const existing = lineOverlays.vertical.find(line => {
              const existingX = typeof line === 'number' ? line : line.x;
              return Math.abs(existingX - pixelX) < 0.1; // Small tolerance for floating point
            });
            
            if (existing && typeof existing === 'object') {
              // Preserve existing endpoints
              return { x: pixelX, y1: existing.y1 || 0, y2: existing.y2 || videoDimensions.height };
            }
          }
          
          // Default endpoints for new lines
          return { x: pixelX, y1: 0, y2: videoDimensions.height };
        });

        onLineOverlaysChange({
          horizontal: horizontalPixels,
          vertical: verticalPixels,
        });
      }

      const updated = newConfigs.map((config, i) => {
        const hIdx = Math.floor(i / vRegions);
        const vIdx = i % vRegions;
        
        let x, y, width, height;
        
        if (lineUnit === 'percent') {
          x = vPositions[vIdx];
          y = hPositions[hIdx];
          width = vPositions[vIdx + 1] - vPositions[vIdx];
          height = hPositions[hIdx + 1] - hPositions[hIdx];
        } else {
          // Convert pixels to percent
          x = (vPositions[vIdx] / videoDimensions.width) * 100;
          y = (hPositions[hIdx] / videoDimensions.height) * 100;
          width = ((vPositions[vIdx + 1] - vPositions[vIdx]) / videoDimensions.width) * 100;
          height = ((hPositions[hIdx + 1] - hPositions[hIdx]) / videoDimensions.height) * 100;
        }
        
        return {
          ...config,
          crop: {
            x,
            y,
            width,
            height,
            unit: 'percent'
          }
        };
      });
      
      onGifConfigsChange(updated);
    }
  }, [horizontalLines, verticalLines, lineUnit, videoDimensions]);

  const addHorizontalLine = () => {
    const value = parseFloat(hLineInput);
    if (!isNaN(value) && value > 0) {
      onParamsChange(prev => ({
        ...prev,
        horizontalLines: [...prev.horizontalLines, value]
      }));
      setHLineInput('');
    }
  };

  const addVerticalLine = () => {
    const value = parseFloat(vLineInput);
    if (!isNaN(value) && value > 0) {
      onParamsChange(prev => ({
        ...prev,
        verticalLines: [...prev.verticalLines, value]
      }));
      setVLineInput('');
    }
  };

  const removeHorizontalLine = (index) => {
    onParamsChange(prev => ({
      ...prev,
      horizontalLines: prev.horizontalLines.filter((_, i) => i !== index)
    }));
  };

  const removeVerticalLine = (index) => {
    onParamsChange(prev => ({
      ...prev,
      verticalLines: prev.verticalLines.filter((_, i) => i !== index)
    }));
  };

  const hRegions = horizontalLines.length + 1;
  const vRegions = verticalLines.length + 1;
  const totalRegions = hRegions * vRegions;

  const handleConfigChange = (index, field, value) => {
    const updated = [...gifConfigs];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onGifConfigsChange(updated);
  };

  return (
    <div className="crop-section">
      <h3>Line Settings</h3>
      
      <div className="input-group">
        <label>Line Unit</label>
        <select
          value={lineUnit}
          onChange={(e) => onParamsChange(prev => ({ ...prev, lineUnit: e.target.value }))}
        >
          <option value="pixels">Pixels</option>
          <option value="percent">Percent</option>
        </select>
      </div>
      
      <div className="line-input-section">
        <h4>Horizontal Lines</h4>
        <div className="line-input-group">
          <input
            type="number"
            min="0"
            step={lineUnit === 'percent' ? '1' : '1'}
            max={lineUnit === 'percent' ? '100' : undefined}
            placeholder={`Position in ${lineUnit}`}
            value={hLineInput}
            onChange={(e) => setHLineInput(e.target.value)}
          />
          <button className="button" onClick={addHorizontalLine}>Add Line</button>
        </div>
        <div className="line-list">
          {horizontalLines.map((line, index) => (
            <div key={index} className="line-item">
              <span>{line} {lineUnit}</span>
              <button
                className="remove-button"
                onClick={() => removeHorizontalLine(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="line-input-section">
        <h4>Vertical Lines</h4>
        <div className="line-input-group">
          <input
            type="number"
            min="0"
            step={lineUnit === 'percent' ? '1' : '1'}
            max={lineUnit === 'percent' ? '100' : undefined}
            placeholder={`Position in ${lineUnit}`}
            value={vLineInput}
            onChange={(e) => setVLineInput(e.target.value)}
          />
          <button className="button" onClick={addVerticalLine}>Add Line</button>
        </div>
        <div className="line-list">
          {verticalLines.map((line, index) => (
            <div key={index} className="line-item">
              <span>{line} {lineUnit}</span>
              <button
                className="remove-button"
                onClick={() => removeVerticalLine(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="input-group">
        <label>Total Regions: {totalRegions}</label>
      </div>
      
      <h3 style={{ marginTop: '1.5rem' }}>GIF Configurations</h3>
      <div className="config-list">
        {gifConfigs.map((config, index) => {
          const hIdx = Math.floor(index / vRegions);
          const vIdx = index % vRegions;
          return (
            <div key={index} className="config-item">
              <div className="config-item-header">
                <span className="config-item-title">Region {hIdx + 1}-{vIdx + 1}</span>
              </div>
              
              <div className="config-grid">
                <div className="input-group">
                  <label>Filename</label>
                  <input
                    type="text"
                    value={config.filename}
                    onChange={(e) => handleConfigChange(index, 'filename', e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label>Start Time (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={config.start_time}
                    onChange={(e) => handleConfigChange(index, 'start_time', e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label>Duration (seconds)</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={config.duration}
                    onChange={(e) => handleConfigChange(index, 'duration', e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label>FPS</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={config.fps}
                    onChange={(e) => handleConfigChange(index, 'fps', e.target.value)}
                  />
                </div>
                
                <div className="input-group">
                  <label>Scale (width, optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Auto"
                    value={config.scale || ''}
                    onChange={(e) => handleConfigChange(index, 'scale', e.target.value || null)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LineCrop;

