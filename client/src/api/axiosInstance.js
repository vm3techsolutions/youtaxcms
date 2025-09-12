import axios from "axios";

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api", // Replace with your Node.js backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    // Get user token from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor (optional: handle errors globally)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized, redirect to login
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
