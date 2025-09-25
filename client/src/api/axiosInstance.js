import axios from "axios";

// 🔹 Helper: safely get token
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }
  return null;
};

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor → automatically attach token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor → global 401 handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // 🔄 Clear both storages
        localStorage.removeItem("token");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("currentAdmin");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("userInfo");
        sessionStorage.removeItem("currentAdmin");

        // 🔀 Redirect (adjust path as needed)
        window.location.href = "/user/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
