import axios from 'axios';

const DICE_BASE_URL = import.meta.env.VITE_DICE_API_BASE_URL || 'http://localhost:5000/api/dice';

const diceClient = axios.create({
  baseURL: DICE_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for Uniform Error Normalization
diceClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred while communicating with Dice backend';

    const normalizedError = new Error(message);
    normalizedError.statusCode = error.response?.status;
    normalizedError.details = error.response?.data;
    normalizedError.isDiceService = true;
    return Promise.reject(normalizedError);
  }
);

// 1. System Health & Session Status
export const fetchDiceHealth = () =>
  diceClient.get('/health').then((res) => res.data);

export const fetchDiceStatus = (checkLive = false) =>
  diceClient.get('/settings/dice-status', { params: { check_live: checkLive } }).then((res) => res.data);

export const fetchDiceStats = () =>
  diceClient.get('/dashboard/stats').then((res) => res.data);

export const fetchDiceSettings = () =>
  diceClient.get('/settings').then((res) => res.data);

export const updateDiceSettings = (data) =>
  diceClient.put('/settings', data).then((res) => res.data);

export const openDiceLogin = () =>
  diceClient.post('/settings/open-dice-login').then((res) => res.data);

// 2. Resumes Library
export const fetchDiceResumes = (search = '', role = '') => {
  const params = {};
  if (search) params.search = search;
  if (role) params.role = role;
  return diceClient.get('/resumes', { params }).then((res) => res.data);
};

export const fetchDiceResume = (id) =>
  diceClient.get(`/resumes/${id}`).then((res) => res.data);

export const uploadDiceResumes = (files, onProgress) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('files', file);
  });

  return diceClient.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  }).then((res) => res.data);
};

export const reparseDiceResume = (id) =>
  diceClient.post(`/resumes/${id}/reparse`).then((res) => res.data);

export const deleteDiceResume = (id) =>
  diceClient.delete(`/resumes/${id}`).then((res) => res.data);

export const updateDiceResume = (id, data) =>
  diceClient.put(`/resumes/${id}`, data).then((res) => res.data);

// 3. Search Profiles
export const fetchSearchProfiles = () =>
  diceClient.get('/search-profiles').then((res) => res.data);

export const createSearchProfile = (data) =>
  diceClient.post('/search-profiles', data).then((res) => res.data);

export const updateSearchProfile = (id, data) =>
  diceClient.put(`/search-profiles/${id}`, data).then((res) => res.data);

export const deleteSearchProfile = (id) =>
  diceClient.delete(`/search-profiles/${id}`).then((res) => res.data);

export const runSearchProfile = (id) =>
  diceClient.post(`/search-profiles/${id}/run`).then((res) => res.data);

// 4. Dice Jobs
export const fetchDiceJobs = (params = {}) =>
  diceClient.get('/jobs', { params }).then((res) => res.data);

export const fetchDiceJob = (id) =>
  diceClient.get(`/jobs/${id}`).then((res) => res.data);

export const analyzeDiceJob = (id) =>
  diceClient.post(`/jobs/${id}/analyze`).then((res) => res.data);

export const matchDiceJob = (id) =>
  diceClient.post(`/jobs/${id}/match`).then((res) => res.data);

export const matchDirectDice = (req) =>
  diceClient.post('/jobs/match-direct', req).then((res) => res.data);

// 5. Applications & Queue
export const fetchDiceApplications = (status) => {
  const params = status && status !== 'ALL' ? { status } : {};
  return diceClient.get('/applications', { params }).then((res) => res.data);
};

export const fetchDiceApplication = (id) =>
  diceClient.get(`/applications/${id}`).then((res) => res.data);

export const fetchDiceApplicationStatus = (id) =>
  diceClient.get(`/applications/${id}/status`).then((res) => res.data);

export const queueDiceApplication = (payload) =>
  diceClient.post('/applications/queue', payload).then((res) => res.data);

export const retryDiceApplication = (id) =>
  diceClient.post(`/applications/${id}/retry`).then((res) => res.data);

export const fetchDiceQueueStatus = () =>
  diceClient.get('/applications/queue/status').then((res) => res.data);

// 6. Review Queue
export const fetchReviewQueue = () =>
  diceClient.get('/review-queue').then((res) => res.data);

export const answerReviewQuestion = (questionId, answerText) =>
  diceClient.post(`/review-queue/${questionId}/answer`, { answer_text: answerText }).then((res) => res.data);

export default diceClient;
