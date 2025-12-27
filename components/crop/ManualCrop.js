import React from 'react';

function ManualCrop({
  videoDimensions,
  gifConfigs,
  onGifConfigsChange
}) {
  const addConfig = () => {
    const newConfig = {
      filename: `manual_${gifConfigs.length + 1}.gif`,
      start_time: 0,
      duration: 5,
      fps: 15,
      scale: null,
      crop: {
        x: 0,
        y: 0,
        width: videoDimensions.width || 100,
        height: videoDimensions.height || 100,
        unit: 'pixels'
      }
    };
    onGifConfigsChange([...gifConfigs, newConfig]);
  };

  const removeConfig = (index) => {
    onGifConfigsChange(gifConfigs.filter((_, i) => i !== index));
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

  const handleCropUnitChange = (index, unit) => {
    const updated = [...gifConfigs];
    const config = updated[index];
    
    // Convert between pixels and percent
    if (unit === 'percent' && config.crop.unit === 'pixels') {
      // Convert pixels to percent
      updated[index] = {
        ...config,
        crop: {
          x: (config.crop.x / videoDimensions.width) * 100,
          y: (config.crop.y / videoDimensions.height) * 100,
          width: (config.crop.width / videoDimensions.width) * 100,
          height: (config.crop.height / videoDimensions.height) * 100,
          unit: 'percent'
        }
      };
    } else if (unit === 'pixels' && config.crop.unit === 'percent') {
      // Convert percent to pixels
      updated[index] = {
        ...config,
        crop: {
          x: (config.crop.x / 100) * videoDimensions.width,
          y: (config.crop.y / 100) * videoDimensions.height,
          width: (config.crop.width / 100) * videoDimensions.width,
          height: (config.crop.height / 100) * videoDimensions.height,
          unit: 'pixels'
        }
      };
    } else {
      updated[index] = {
        ...config,
        crop: {
          ...config.crop,
          unit
        }
      };
    }
    
    onGifConfigsChange(updated);
  };

  return (
    <div className="crop-section">
      <h3>Manual Crop Regions</h3>
      
      <button className="add-button" onClick={addConfig}>
        + Add Crop Region
      </button>
      
      <div className="config-list">
        {gifConfigs.map((config, index) => (
          <div key={index} className="config-item">
            <div className="config-item-header">
              <span className="config-item-title">Crop Region {index + 1}</span>
              <button
                className="remove-button"
                onClick={() => removeConfig(index)}
              >
                Remove
              </button>
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
              
              <div className="input-group full-width">
                <label>Crop Unit</label>
                <select
                  value={config.crop.unit}
                  onChange={(e) => handleCropUnitChange(index, e.target.value)}
                >
                  <option value="pixels">Pixels</option>
                  <option value="percent">Percent</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>X Position ({config.crop.unit})</label>
                <input
                  type="number"
                  min="0"
                  step={config.crop.unit === 'percent' ? '0.1' : '1'}
                  max={config.crop.unit === 'percent' ? '100' : undefined}
                  value={config.crop.x}
                  onChange={(e) => handleCropChange(index, 'x', e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label>Y Position ({config.crop.unit})</label>
                <input
                  type="number"
                  min="0"
                  step={config.crop.unit === 'percent' ? '0.1' : '1'}
                  max={config.crop.unit === 'percent' ? '100' : undefined}
                  value={config.crop.y}
                  onChange={(e) => handleCropChange(index, 'y', e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label>Width ({config.crop.unit})</label>
                <input
                  type="number"
                  min="1"
                  step={config.crop.unit === 'percent' ? '0.1' : '1'}
                  max={config.crop.unit === 'percent' ? '100' : undefined}
                  value={config.crop.width}
                  onChange={(e) => handleCropChange(index, 'width', e.target.value)}
                />
              </div>
              
              <div className="input-group">
                <label>Height ({config.crop.unit})</label>
                <input
                  type="number"
                  min="1"
                  step={config.crop.unit === 'percent' ? '0.1' : '1'}
                  max={config.crop.unit === 'percent' ? '100' : undefined}
                  value={config.crop.height}
                  onChange={(e) => handleCropChange(index, 'height', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {gifConfigs.length === 0 && (
        <div className="info-message" style={{ marginTop: '1rem' }}>
          Click "Add Crop Region" to create your first crop configuration
        </div>
      )}
    </div>
  );
}

export default ManualCrop;

