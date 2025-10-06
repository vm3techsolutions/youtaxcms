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

// ✅ Update Admin User
export const updateAdminUser = createAsyncThunk(
  "adminUsers/update",
  async (formData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.put(`/admin/users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { id: formData.id, updated: formData }; 
      // We assume backend returns just success msg. 
      // If backend returns updated user, replace this with res.data.user
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update admin user");
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
    updateLoading: false,
    updateSuccess: false,
  },
  reducers: {
    resetAdminUsersState: (state) => {
      state.usersByRole = [];
      state.loading = false;
      state.error = null;
      state.updateLoading = false;
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
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
      })

      // Update User
      .addCase(updateAdminUser.pending, (state) => {
        state.updateLoading = true;
        state.updateSuccess = false;
        state.error = null;
      })
      .addCase(updateAdminUser.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = true;

        // Update user in state
        const { id, updated } = action.payload;
        state.usersByRole = state.usersByRole.map((user) =>
          user.id === id ? { ...user, ...updated } : user
        );
      })
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateSuccess = false;
        state.error = action.payload;
      });
  },
});

export const { resetAdminUsersState } = adminUsersSlice.actions;
export default adminUsersSlice.reducer;
