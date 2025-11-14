import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

/* ===================================================
   ✅ CREATE CATEGORY
=================================================== */
export const createCategory = createAsyncThunk(
  "category/createCategory",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/service-categories", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create category"
      );
    }
  }
);

/* ===================================================
   ✅ FETCH ALL CATEGORIES
=================================================== */
export const fetchCategories = createAsyncThunk(
  "category/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/service-categories");
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

/* ===================================================
   ✅ FETCH SINGLE CATEGORY BY ID
=================================================== */
export const fetchCategoryById = createAsyncThunk(
  "category/fetchCategoryById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/service-category/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch category details"
      );
    }
  }
);

/* ===================================================
   ✅ UPDATE CATEGORY
=================================================== */
export const updateCategory = createAsyncThunk(
  "category/updateCategory",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/service-category/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update category"
      );
    }
  }
);

/* ===================================================
   ✅ DELETE CATEGORY
=================================================== */
export const deleteCategory = createAsyncThunk(
  "category/deleteCategory",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(`/service-category/${id}`);
      return { id, message: res.data.message };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete category"
      );
    }
  }
);

/* ===================================================
   ✅ SLICE
=================================================== */
const categorySlice = createSlice({
  name: "category",
  initialState: {
    categories: [],
    category: null,
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearCategoryState: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* ---------- CREATE CATEGORY ---------- */
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || "Category created successfully!";
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- FETCH ALL ---------- */
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- FETCH SINGLE ---------- */
      .addCase(fetchCategoryById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.loading = false;
        state.category = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- UPDATE CATEGORY ---------- */
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || "Category updated successfully!";
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ---------- DELETE CATEGORY ---------- */
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message || "Category deleted successfully!";
        state.categories = state.categories.filter((cat) => cat.id !== action.payload.id);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCategoryState } = categorySlice.actions;
export default categorySlice.reducer;
