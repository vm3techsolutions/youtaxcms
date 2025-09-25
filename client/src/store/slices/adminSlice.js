"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// 🔹 Helpers
const getStorageItem = (key) => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(key) ||
      sessionStorage.getItem(key) // check both
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

// --------------------- Async Thunks ---------------------

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

// 👉 Admin login (with rememberMe)
export const loginAdmin = createAsyncThunk(
  "admin/login",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/admin/login", { email, password });

      if (typeof window !== "undefined") {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", res.data.token);
        storage.setItem("currentAdmin", JSON.stringify(res.data.admin));
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
      if (!token) throw new Error("No token found");

      const res = await axiosInstance.get("/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (typeof window !== "undefined") {
        const storage =
          localStorage.getItem("token") === token ? localStorage : sessionStorage;
        storage.setItem("currentAdmin", JSON.stringify(res.data));
      }

      return res.data;
    } catch (err) {
      return rejectWithValue("Failed to fetch current admin");
    }
  }
);

// --------------------- Slice ---------------------

const initialState = {
  admins: [],
  roles: [],
  currentAdmin: parseJSON(getStorageItem("currentAdmin")),
  token: getStorageItem("token"),
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
      state.success = false;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("currentAdmin");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("currentAdmin");
      }
    },
    setToken: (state, action) => {
      state.token = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload);
      }
    },
    resetSuccess: (state) => {
      state.success = false;
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
        state.error = action.payload;
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("currentAdmin");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("currentAdmin");
        }
      });
  },
});

export const { logoutAdmin, setToken, resetSuccess } = adminSlice.actions;
export default adminSlice.reducer;
