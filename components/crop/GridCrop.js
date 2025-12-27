import React, { useEffect } from 'react';

function GridCrop({
  rows,
  columns,
  onParamsChange,
  videoDimensions,
  gifConfigs,
  onGifConfigsChange
}) {
  useEffect(() => {
    // Auto-generate GIF configs based on grid
    const totalCells = rows * columns;
    const newConfigs = [];
    
    for (let i = 0; i < totalCells; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      
      // Check if config already exists
      const existingConfig = gifConfigs[i];
      
      if (existingConfig) {
        newConfigs.push(existingConfig);
      } else {
        newConfigs.push({
          filename: `grid_${row}_${col}.gif`,
          start_time: 0,
          duration: 5,
          fps: 15,
          scale: null,
          crop: {
            x: (col / columns) * 100,
            y: (row / rows) * 100,
            width: 100 / columns,
            height: 100 / rows,
            unit: 'percent'
          }
        });
      }
    }
    
    // Remove excess configs if grid size decreased
    if (newConfigs.length !== gifConfigs.length) {
      onGifConfigsChange(newConfigs);
    } else {
      // Update crop regions for existing configs
      const updated = newConfigs.map((config, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        return {
          ...config,
          crop: {
            ...config.crop,
            x: (col / columns) * 100,
            y: (row / rows) * 100,
            width: 100 / columns,
            height: 100 / rows,
            unit: 'percent'
          }
        };
      });
      onGifConfigsChange(updated);
    }
  }, [rows, columns, videoDimensions]);

  const handleRowsChange = (e) => {
    onParamsChange(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }));
  };

  const handleColumnsChange = (e) => {
    onParamsChange(prev => ({ ...prev, columns: parseInt(e.target.value) || 1 }));
  };

  const handleConfigChange = (index, field, value) => {
    const updated = [...gifConfigs];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onGifConfigsChange(updated);
  };

  const handleCropChange = (index, field, value) => {
    const updated = [...gifConfigs];
    updated[index] = {
      ...updated[index],
      crop: {
        ...updated[index].crop,
        [field]: parseFloat(value) || 0
      }
    };
    onGifConfigsChange(updated);
  };

  return (
    <div className="crop-section">
      <h3>Grid Settings</h3>
      
      <div className="input-group">
        <label>Rows</label>
        <input
          type="number"
          min="1"
          max="10"
          value={rows}
          onChange={handleRowsChange}
        />
      </div>
      
      <div className="input-group">
        <label>Columns</label>
        <input
          type="number"
          min="1"
          max="10"
          value={columns}
          onChange={handleColumnsChange}
        />
      </div>
      
      <div className="input-group">
        <label>Total Regions: {rows * columns}</label>
      </div>
      
      <h3 style={{ marginTop: '1.5rem' }}>GIF Configurations</h3>
      <div className="config-list">
        {gifConfigs.map((config, index) => {
          const row = Math.floor(index / columns);
          const col = index % columns;
          return (
            <div key={index} className="config-item">
              <div className="config-item-header">
                <span className="config-item-title">Region {row + 1}-{col + 1}</span>
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

export default GridCrop;

