import React, { useState, useEffect } from 'react';
import './CropConfig.css';
import GridCrop from './crop/GridCrop';
import LineCrop from './crop/LineCrop';
import DragCrop from './crop/DragCrop';

function CropConfig({
  cropMethod,
  onCropMethodChange,
  videoDimensions,
  gifConfigs,
  onGifConfigsChange,
  onProcessGIFs,
  videoId,
  videoReady,
  onLineOverlaysChange,
  dragRegions,
  onDragRegionsChange,
}) {
  const [cropParams, setCropParams] = useState({
    rows: 2,
    columns: 2,
    horizontalLines: [],
    verticalLines: [],
    lineUnit: 'pixels'
  });

  const handleMethodChange = (method) => {
    onCropMethodChange(method);
    // Reset configs when method changes
    onGifConfigsChange([]);
    if (method !== 'drag') {
      onDragRegionsChange([]);
    }
  };

  const handleProcess = () => {
    if (gifConfigs.length === 0) {
      alert('Please configure at least one GIF');
      return;
    }
    onProcessGIFs(gifConfigs, cropMethod, cropParams);
  };

  const renderCropMethod = () => {
    switch (cropMethod) {
      case 'grid':
        return (
          <GridCrop
            rows={cropParams.rows}
            columns={cropParams.columns}
            onParamsChange={setCropParams}
            videoDimensions={videoDimensions}
            gifConfigs={gifConfigs}
            onGifConfigsChange={onGifConfigsChange}
          />
        );
      case 'lines':
        return (
          <LineCrop
            horizontalLines={cropParams.horizontalLines}
            verticalLines={cropParams.verticalLines}
            lineUnit={cropParams.lineUnit}
            onParamsChange={setCropParams}
            videoDimensions={videoDimensions}
            gifConfigs={gifConfigs}
            onGifConfigsChange={onGifConfigsChange}
            onLineOverlaysChange={onLineOverlaysChange}
          />
        );
      case 'drag':
        return (
          <DragCrop
            videoDimensions={videoDimensions}
            gifConfigs={gifConfigs}
            onGifConfigsChange={onGifConfigsChange}
            dragRegions={dragRegions}
            onDragRegionsChange={onDragRegionsChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="card crop-config">
      <h2>Crop Configuration</h2>
      
      <div className="crop-config-content">
        <div className="input-group">
          <label>Crop Method</label>
          <select
            value={cropMethod}
            onChange={(e) => handleMethodChange(e.target.value)}
            disabled={!videoReady}
          >
            <option value="grid">Grid-based Crop</option>
            <option value="lines">Line-based Crop</option>
            <option value="drag">Drag-based Crop</option>
          </select>
        </div>

        {videoReady ? (
          <>
            {renderCropMethod()}
            
            <div className="action-buttons">
              <button
                className="button"
                onClick={handleProcess}
                disabled={gifConfigs.length === 0}
              >
                Generate GIFs
              </button>
            </div>
          </>
        ) : (
          <div className="info-message">
            Please download or upload a video first
          </div>
        )}
      </div>
    </div>
  );
}

export default CropConfig;

