import api from './api';

export const processGIFs = async (videoId, gifConfigs, cropMethod, cropParams) => {
  const payload = {
    video_id: videoId,
    gif_configs: gifConfigs.map(config => ({
      filename: config.filename,
      start_time: parseFloat(config.start_time),
      duration: parseFloat(config.duration),
      fps: parseInt(config.fps),
      scale: config.scale ? parseInt(config.scale) : null,
      crop: {
        x: parseFloat(config.crop.x),
        y: parseFloat(config.crop.y),
        width: parseFloat(config.crop.width),
        height: parseFloat(config.crop.height),
        unit: config.crop.unit || 'pixels'
      }
    }))
  };

  let endpoint = '/api/process-gifs';
  
  if (cropMethod === 'grid') {
    endpoint = '/api/grid-crop';
    payload.rows = cropParams.rows;
    payload.columns = cropParams.columns;
  } else if (cropMethod === 'lines') {
    endpoint = '/api/line-crop';
    payload.horizontal_lines = cropParams.horizontalLines;
    payload.vertical_lines = cropParams.verticalLines;
    payload.line_unit = cropParams.lineUnit;
  }

  const response = await api.post(endpoint, payload);
  return response.data;
};

export const getGIFStatus = async (videoId) => {
  const response = await api.get(`/api/gif-status/${videoId}`);
  return response.data;
};

export const getGIFUrl = (gifId) => {
  return `http://localhost:8000/api/gif/${gifId}`;
};

export const clearGIFs = async (videoId) => {
  const response = await api.delete(`/api/clear-gifs/${videoId}`);
  return response.data;
};

