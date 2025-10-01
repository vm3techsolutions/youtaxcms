import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ========================
// Async Thunks
// ========================
export const fetchAdminUsersByRole = createAsyncThunk(
  "adminUsers/fetchByRole",
  async (roleId, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await axiosInstance.get(`/admin/users/role/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { roleId, users: res.data.data }; // ✅ store by roleId
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch admin users by role"
      );
    }
  }
);

// ========================
// Slice
// ========================
const adminUsersSliceSecond = createSlice({
  name: "adminUsersSecond",
  initialState: {
    usersByRole: {}, // ✅ object keyed by roleId
    loading: false,
    error: null,
  },
  reducers: {
    resetAdminUsersState: (state) => {
      state.usersByRole = {};
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
        const { roleId, users } = action.payload;
        state.usersByRole[roleId] = users; // ✅ grouped by roleId
      })
      .addCase(fetchAdminUsersByRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ========================
// Exports
// ========================
export const { resetAdminUsersState } = adminUsersSliceSecond.actions;
export default adminUsersSliceSecond.reducer;
