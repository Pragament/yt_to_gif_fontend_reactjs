import React, { useEffect } from 'react';

function DragCrop({
  videoDimensions,
  gifConfigs,
  onGifConfigsChange,
  dragRegions,
  onDragRegionsChange,
}) {
  useEffect(() => {
    // Auto-generate GIF configs from drag regions
    if (dragRegions && dragRegions.length > 0) {
      const newConfigs = dragRegions.map((region, index) => {
        const existingConfig = gifConfigs[index];
        
        // Check if crop values match - if so, keep existing config (preserves user edits)
        if (existingConfig && 
            Math.round(existingConfig.crop.x) === region.x &&
            Math.round(existingConfig.crop.y) === region.y &&
            Math.round(existingConfig.crop.width) === region.width &&
            Math.round(existingConfig.crop.height) === region.height) {
          return existingConfig;
        }
        
        // Update crop or create new config
        return {
          filename: existingConfig?.filename || `drag_${index + 1}.gif`,
          start_time: existingConfig?.start_time || 0,
          duration: existingConfig?.duration || 5,
          fps: existingConfig?.fps || 15,
          scale: existingConfig?.scale || null,
          crop: {
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            unit: 'pixels'
          }
        };
      });
      
      // Only update if configs actually changed
      const configsChanged = newConfigs.length !== gifConfigs.length ||
        newConfigs.some((config, idx) => {
          const old = gifConfigs[idx];
          return !old || 
            config.crop.x !== old.crop.x ||
            config.crop.y !== old.crop.y ||
            config.crop.width !== old.crop.width ||
            config.crop.height !== old.crop.height;
        });
      
      if (configsChanged) {
        onGifConfigsChange(newConfigs);
      }
    } else if (dragRegions && dragRegions.length === 0 && gifConfigs.length > 0) {
      // Clear configs if no regions
      onGifConfigsChange([]);
    }
  }, [dragRegions]);

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
      <h3>Drag-based Crop</h3>
      
      <div className="info-message" style={{ marginBottom: '1rem' }}>
        Click and drag on the video preview to create crop regions. Each region will generate a separate GIF.
      </div>
      
      <div className="input-group">
        <label>Total Crop Regions: {dragRegions?.length || 0}</label>
      </div>
      
      {dragRegions && dragRegions.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>GIF Configurations</h3>
          <div className="config-list">
            {gifConfigs.map((config, index) => (
              <div key={index} className="config-item">
                <div className="config-item-header">
                  <span className="config-item-title">Crop Region {index + 1}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div className="crop-info">
                      {Math.round(config.crop.x)}, {Math.round(config.crop.y)} - 
                      {Math.round(config.crop.width)} × {Math.round(config.crop.height)}px
                    </div>
                    <button
                      className="remove-button"
                      onClick={() => {
                        if (onDragRegionsChange) {
                          onDragRegionsChange(dragRegions.filter((_, i) => i !== index));
                        }
                      }}
                      title="Remove this crop region"
                    >
                      Remove
                    </button>
                  </div>
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
            ))}
          </div>
        </>
      )}
      
      {(!dragRegions || dragRegions.length === 0) && (
        <div className="info-message" style={{ marginTop: '1rem' }}>
          No crop regions yet. Drag on the video preview to create your first crop region.
        </div>
      )}
    </div>
  );
}

export default DragCrop;

