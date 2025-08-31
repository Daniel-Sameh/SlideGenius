import axios from 'axios';
import Cookies from 'js-cookie'; // Import js-cookie

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api'
  : `${process.env.NEXT_PUBLIC_API_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Use an interceptor to automatically add the auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Use js-cookie to reliably get the token on the client side
    const token = Cookies.get('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;