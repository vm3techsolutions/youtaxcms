import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ============================================================
// Create Service Input
// Backend expects: { service_id, fields: [...] }
// ============================================================
export const createServiceInput = createAsyncThunk(
  "serviceInput/createServiceInput",
  async ({ service_id, fields }, thunkAPI) => {
    try {
      const payload = { service_id, fields };

      console.log("📤 Sending to backend:", payload);

      const res = await axiosInstance.post(`/service-input`, payload);
      return res.data;

    } catch (err) {
      console.error("❌ createServiceInput Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Get Service Inputs by Service ID
// ============================================================
export const getServiceInputsByService = createAsyncThunk(
  "serviceInput/getServiceInputsByService",
  async (serviceId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/service-inputs/service/${serviceId}`);
      return res.data;
    } catch (err) {
      console.error("❌ getServiceInputsByService Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Get Single Service Input by ID
// ============================================================
export const getServiceInputById = createAsyncThunk(
  "serviceInput/getServiceInputById",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/service-input/${id}`);
      return res.data;
    } catch (err) {
      console.error("❌ getServiceInputById Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Update Service Input (Admin Only)
// ============================================================
export const updateServiceInput = createAsyncThunk(
  "serviceInput/updateServiceInput",
  async ({ id, data }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/service-input/${id}`, data);
      return res.data;
    } catch (err) {
      console.error("❌ updateServiceInput Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Delete Service Input (Admin Only)
// ============================================================
export const deleteServiceInput = createAsyncThunk(
  "serviceInput/deleteServiceInput",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/service-input/${id}`);
      return { id, ...res.data };
    } catch (err) {
      console.error("❌ deleteServiceInput Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Slice
// ============================================================
const serviceInputSlice = createSlice({
  name: "serviceInput",
  initialState: {
    items: [],
    single: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createServiceInput.pending, (state) => {
        state.loading = true;
      })
      .addCase(createServiceInput.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createServiceInput.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET BY SERVICE
      .addCase(getServiceInputsByService.pending, (state) => {
        state.loading = true;
      })
      .addCase(getServiceInputsByService.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(getServiceInputsByService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GET SINGLE
      .addCase(getServiceInputById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getServiceInputById.fulfilled, (state, action) => {
        state.loading = false;
        state.single = action.payload;
      })
      .addCase(getServiceInputById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateServiceInput.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateServiceInput.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateServiceInput.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // DELETE
      .addCase(deleteServiceInput.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteServiceInput.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload.id);
      })
      .addCase(deleteServiceInput.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default serviceInputSlice.reducer;


// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosInstance from "@/api/axiosInstance";

// // ============================================================
// // CREATE Service Input
// // Backend expects: { service_id, fields: [...] }
// // ============================================================
// export const createServiceInput = createAsyncThunk(
//   "serviceInput/createServiceInput",
//   async ({ service_id, fields }, thunkAPI) => {
//     try {
//       const payload = { service_id, fields };
//       const res = await axiosInstance.post(`/service-input`, payload);
//       return res.data; // MUST return created data
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );

// // ============================================================
// // GET Inputs by Service ID
// // ============================================================
// export const getServiceInputsByService = createAsyncThunk(
//   "serviceInput/getServiceInputsByService",
//   async (serviceId, thunkAPI) => {
//     try {
//       const res = await axiosInstance.get(`/service-inputs/service/${serviceId}`);
//       return res.data;
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );

// // ============================================================
// // UPDATE Service Input
// // ============================================================
// export const updateServiceInput = createAsyncThunk(
//   "serviceInput/updateServiceInput",
//   async ({ id, data }, thunkAPI) => {
//     try {
//       const res = await axiosInstance.put(`/service-input/${id}`, data);
//       return { id, ...res.data }; // return id + updated data
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );

// // ============================================================
// // DELETE Service Input
// // ============================================================
// export const deleteServiceInput = createAsyncThunk(
//   "serviceInput/deleteServiceInput",
//   async (id, thunkAPI) => {
//     try {
//       const res = await axiosInstance.delete(`/service-input/${id}`);
//       return { id, ...res.data };
//     } catch (err) {
//       return thunkAPI.rejectWithValue(err.response?.data || err.message);
//     }
//   }
// );

// // ============================================================
// // SLICE
// // ============================================================
// const serviceInputSlice = createSlice({
//   name: "serviceInput",
//   initialState: {
//     items: [],
//     single: null,
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder

//       // CREATE
//       .addCase(createServiceInput.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(createServiceInput.fulfilled, (state, action) => {
//         state.loading = false;

//         // ⬅️ Append newly created fields to list
//         if (Array.isArray(action.payload)) {
//           state.items.push(...action.payload);
//         } else {
//           state.items.push(action.payload);
//         }
//       })
//       .addCase(createServiceInput.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // GET ALL
//       .addCase(getServiceInputsByService.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(getServiceInputsByService.fulfilled, (state, action) => {
//         state.loading = false;
//         state.items = action.payload;
//       })
//       .addCase(getServiceInputsByService.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // UPDATE
//       .addCase(updateServiceInput.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(updateServiceInput.fulfilled, (state, action) => {
//         state.loading = false;

//         const updated = action.payload;

//         // ⬅️ Update the field in state.items
//         state.items = state.items.map((item) =>
//           item.id === updated.id ? { ...item, ...updated } : item
//         );
//       })
//       .addCase(updateServiceInput.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })

//       // DELETE
//       .addCase(deleteServiceInput.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(deleteServiceInput.fulfilled, (state, action) => {
//         state.loading = false;
//         state.items = state.items.filter(
//           (item) => item.id !== action.payload.id
//         );
//       })
//       .addCase(deleteServiceInput.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   },
// });

// export default serviceInputSlice.reducer;
