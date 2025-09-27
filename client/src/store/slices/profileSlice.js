// src/store/slices/profileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ API Base
const API_URL = "http://localhost:5000/api"; // adjust backend base url

// ✅ Thunks
export const fetchProfiles = createAsyncThunk(
  "profile/fetchProfiles",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/customerprofile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchProfileById = createAsyncThunk(
  "profile/fetchProfileById",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/customerprofile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createProfile = createAsyncThunk(
  "profile/createProfile",
  async ({ profile_field, field_value }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/customerprofile`,
        { profile_field, field_value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async ({ profile_field, field_value }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/customerprofile`,
        { profile_field, field_value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Slice
const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profiles: [],
    selectedProfile: null,
    loading: false,
    error: null,
    message: null,
  },
  reducers: {
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch all
      .addCase(fetchProfiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles = action.payload;
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetch one
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        state.selectedProfile = action.payload;
      })
      // create
      .addCase(createProfile.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })
      .addCase(createProfile.rejected, (state, action) => {
        state.error = action.payload;
      })
      // update
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.message = action.payload.message;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMessage } = profileSlice.actions;
export default profileSlice.reducer;
