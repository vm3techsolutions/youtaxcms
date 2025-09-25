"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ---------------- Helpers ----------------

// Unique session ID per browser
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

const getStorageItem = (key) => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(key) ||
      sessionStorage.getItem(key)
    );
  }
  return null;
};

const parseJSON = (item) => {
  try {
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

// ---------------- Async Thunks ----------------

// 👉 Register new admin
export const registerAdmin = createAsyncThunk(
  "admin/register",
  async (adminData, { rejectWithValue }) => {
    try {
      const token = getStorageItem("token");
      const res = await axiosInstance.post("/admin/users", adminData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to register admin"
      );
    }
  }
);

// 👉 Admin login
export const loginAdmin = createAsyncThunk(
  "admin/login",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/admin/login", { email, password });

      if (typeof window !== "undefined") {
        const storage = rememberMe ? localStorage : sessionStorage;
        const sessionId = generateSessionId();

        storage.setItem("token", res.data.token);
        storage.setItem("currentAdmin", JSON.stringify(res.data.admin));
        storage.setItem("sessionId", sessionId);
      }

      return res.data; // { message, token, admin }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
    }
  }
);

// 👉 Fetch all admins
export const fetchAdmins = createAsyncThunk(
  "admin/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const token = getStorageItem("token");
      const res = await axiosInstance.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch admins"
      );
    }
  }
);

// 👉 Fetch admin roles
export const fetchAdminRoles = createAsyncThunk(
  "admin/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/roles");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch roles"
      );
    }
  }
);

// 👉 Fetch current admin (persist state after refresh)
export const fetchCurrentAdmin = createAsyncThunk(
  "admin/fetchCurrent",
  async (_, { rejectWithValue }) => {
    try {
      const token = getStorageItem("token");
      const sessionId = getStorageItem("sessionId");

      if (!token || !sessionId) {
        throw new Error("No valid session");
      }

      const res = await axiosInstance.get("/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (typeof window !== "undefined") {
        const storage =
          localStorage.getItem("token") === token ? localStorage : sessionStorage;
        storage.setItem("currentAdmin", JSON.stringify(res.data));
        storage.setItem("sessionId", sessionId); // persist same sessionId
      }

      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch current admin");
    }
  }
);

// ---------------- Slice ----------------

const initialState = {
  admins: [],
  roles: [],
  currentAdmin: parseJSON(getStorageItem("currentAdmin")),
  token: getStorageItem("token"),
  sessionId: getStorageItem("sessionId"),
  registerLoading: false,
  loginLoading: false,
  adminsLoading: false,
  rolesLoading: false,
  fetchCurrentLoading: false,
  error: null,
  success: false,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    logoutAdmin: (state) => {
      state.currentAdmin = null;
      state.token = null;
      state.sessionId = null;
      state.success = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("currentAdmin");
        localStorage.removeItem("sessionId");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("currentAdmin");
        sessionStorage.removeItem("sessionId");
      }
    },
    resetSuccess: (state) => {
      state.success = false;
    },
    checkAdminSession: (state) => {
      if (typeof window !== "undefined") {
        const sessionId = getStorageItem("sessionId");
        if (!sessionId) {
          // No valid session in this browser → force logout
          state.currentAdmin = null;
          state.token = null;
          state.sessionId = null;
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("currentAdmin");
            localStorage.removeItem("sessionId");
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("currentAdmin");
            sessionStorage.removeItem("sessionId");
          }
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerAdmin.pending, (state) => {
        state.registerLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(registerAdmin.fulfilled, (state) => {
        state.registerLoading = false;
        state.success = true;
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.registerLoading = false;
        state.error = action.payload;
      })

      // Login
      .addCase(loginAdmin.pending, (state) => {
        state.loginLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.currentAdmin = action.payload.admin;
        state.token = action.payload.token;
        state.sessionId = getStorageItem("sessionId");
        state.success = true;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loginLoading = false;
        state.error = action.payload;
      })

      // Fetch admins
      .addCase(fetchAdmins.pending, (state) => {
        state.adminsLoading = true;
        state.error = null;
      })
      .addCase(fetchAdmins.fulfilled, (state, action) => {
        state.adminsLoading = false;
        state.admins = action.payload;
      })
      .addCase(fetchAdmins.rejected, (state, action) => {
        state.adminsLoading = false;
        state.error = action.payload;
      })

      // Fetch roles
      .addCase(fetchAdminRoles.pending, (state) => {
        state.rolesLoading = true;
        state.error = null;
      })
      .addCase(fetchAdminRoles.fulfilled, (state, action) => {
        state.rolesLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchAdminRoles.rejected, (state, action) => {
        state.rolesLoading = false;
        state.error = action.payload;
      })

      // Fetch current admin
      .addCase(fetchCurrentAdmin.pending, (state) => {
        state.fetchCurrentLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentAdmin.fulfilled, (state, action) => {
        state.fetchCurrentLoading = false;
        state.currentAdmin = action.payload;
      })
      .addCase(fetchCurrentAdmin.rejected, (state, action) => {
        state.fetchCurrentLoading = false;
        state.currentAdmin = null;
        state.token = null;
        state.sessionId = null;
        state.error = action.payload;
      });
  },
});

export const { logoutAdmin, resetSuccess, checkAdminSession } = adminSlice.actions;
export default adminSlice.reducer;
