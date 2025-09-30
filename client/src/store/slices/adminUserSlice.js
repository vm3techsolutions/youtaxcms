import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ========================
// Async Thunks
// ========================

// Fetch Admin Users by Role ID
export const fetchAdminUsersByRole = createAsyncThunk(
  "adminUsers/fetchByRole",
  async (roleId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.get(`/admin/users/role/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.data; // API returns { success, data: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch admin users by role");
    }
  }
);

// ========================
// Slice
// ========================

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState: {
    usersByRole: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetAdminUsersState: (state) => {
      state.usersByRole = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsersByRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsersByRole.fulfilled, (state, action) => {
        state.loading = false;
        state.usersByRole = action.payload;
      })
      .addCase(fetchAdminUsersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetAdminUsersState } = adminUsersSlice.actions;
export default adminUsersSlice.reducer;
