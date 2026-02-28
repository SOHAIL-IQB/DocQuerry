import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Currently no JWT interceptor added since Auth Phase is skipped/mocked for now.
// The backend requires the token, so we'll simulate an empty or intercepted flow later.
// For now, this is strictly the abstraction.

export default api;
