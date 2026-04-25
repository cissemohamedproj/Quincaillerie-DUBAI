<<<<<<< HEAD
// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    'https://backend-quincaillerie-dubai-vril.onrender.com/api',
  // 'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter token JWT automatiquement
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('authUser');
  const token = user ? JSON.parse(user).token : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
=======
// src/api/api.js
import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.REACT_APP_API_URL ||
    'https://backend-quincaillerie-dubai.onrender.com/api',
  // 'http://localhost:5000/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter token JWT automatiquement
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('authUser');
  const token = user ? JSON.parse(user).token : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
>>>>>>> f1bfc7f1a5aad4c9643605a512f86cfe3ec0e61f
