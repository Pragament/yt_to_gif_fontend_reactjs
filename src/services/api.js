import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const downloadVideo = async (url) => {
  const response = await api.post('/api/download-youtube', { url });
  return response.data;
};

export const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload-video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getVideoStatus = async (videoId) => {
  const response = await api.get(`/api/video-status/${videoId}`);
  return response.data;
};

export const getVideoUrl = (videoId) => {
  return `${API_BASE_URL}/api/video/${videoId}`;
};

export default api;

