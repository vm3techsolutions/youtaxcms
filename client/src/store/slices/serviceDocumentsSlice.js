"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// --------------------- Async Thunks ---------------------

export const createServiceDocument = createAsyncThunk(
  "serviceDocuments/create",
  async (docData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.post("/service-documents", docData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { ...docData, id: res.data.id }; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create service document");
    }
  }
);

export const fetchDocumentsByService = createAsyncThunk(
  "serviceDocuments/fetchByService",
  async (serviceId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/service-documents/service/${serviceId}`);
      return { serviceId, documents: Array.isArray(res.data) ? res.data : [] };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch documents");
    }
  }
);

// ✅ Fetch ONLY ACTIVE documents for frontend
export const fetchActiveDocumentsByService = createAsyncThunk(
  "serviceDocuments/fetchActiveByService",
  async (serviceId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/service-documents/service/${serviceId}/active`
      );

      return {
        serviceId,
        documents: Array.isArray(res.data) ? res.data : [],
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch active documents"
      );
    }
  }
);

export const updateServiceDocument = createAsyncThunk(
  "serviceDocuments/update",
  async ({ id, data, serviceId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.put(`/service-document/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { updatedDoc: res.data, serviceId, id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update document");
    }
  }
);

// ✅ Correct delete thunk using id in URL
export const deleteServiceDocument = createAsyncThunk(
  "serviceDocuments/delete",
  async ({ id, serviceId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.delete(`/service-document/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { id, serviceId, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete document");
    }
  }
);

// Upload sample document
export const uploadSamplePDF = createAsyncThunk(
  "serviceDocuments/uploadSamplePDF",
  async ({ id, file }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const formData = new FormData();
      formData.append("sample_pdf", file);

      const res = await axiosInstance.post(
        `/service-document/upload-sample/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return { id, sample_pdf_url: res.data.sample_pdf_url };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to upload PDF");
    }
  }
);

export const deleteSamplePDF = createAsyncThunk(
  "serviceDocuments/deleteSamplePDF",
  async ({ id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await axiosInstance.delete(`/service-document/delete-sample/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return { id }; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete sample PDF");
    }
  }
);

export const toggleDocumentStatus = createAsyncThunk(
  "serviceDocuments/toggleStatus",
  async ({ id, is_active, serviceId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.patch(
        `/service-documents/${id}/status`,
        { is_active },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { id, is_active, serviceId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
  }
);




// --------------------- Slice ---------------------

const initialState = {
  serviceDocuments: {}, // { [serviceId]: [document, ...] }
  document: null,
  loading: false,
  success: false,
  error: null,
};

const serviceDocumentsSlice = createSlice({
  name: "serviceDocuments",
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createServiceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createServiceDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const doc = action.payload;
        const serviceId = doc.service_id;
        if (!state.serviceDocuments[serviceId]) state.serviceDocuments[serviceId] = [];
        state.serviceDocuments[serviceId].push(doc);
      })
      .addCase(createServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch by service
      .addCase(fetchDocumentsByService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByService.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceDocuments[action.payload.serviceId] = action.payload.documents;
      })
      .addCase(fetchDocumentsByService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= ACTIVE DOCUMENTS (FRONTEND) =================

      .addCase(fetchActiveDocumentsByService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchActiveDocumentsByService.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceDocuments[action.payload.serviceId] =
          action.payload.documents;
      })

      .addCase(fetchActiveDocumentsByService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })


      // Update
      .addCase(updateServiceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateServiceDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const { serviceId, id, updatedDoc } = action.payload;
        if (state.serviceDocuments[serviceId]) {
          const index = state.serviceDocuments[serviceId].findIndex(d => d.id === id);
          if (index !== -1) state.serviceDocuments[serviceId][index] = updatedDoc;
        }
      })
      .addCase(updateServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle Active/Inactive
      .addCase(toggleDocumentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleDocumentStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { id, is_active, serviceId } = action.payload;

        if (state.serviceDocuments[serviceId]) {
          const index = state.serviceDocuments[serviceId].findIndex(d => d.id === id);
          if (index !== -1) {
            state.serviceDocuments[serviceId][index].is_active = is_active;
          }
        }

        state.success = true;
      })
      .addCase(toggleDocumentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      
      // Delete
      .addCase(deleteServiceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteServiceDocument.fulfilled, (state, action) => {
        state.loading = false;
        const { serviceId, id } = action.payload;
        if (state.serviceDocuments[serviceId]) {
          state.serviceDocuments[serviceId] = state.serviceDocuments[serviceId].filter(d => d.id !== id);
        }
      })
      .addCase(deleteServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(uploadSamplePDF.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(uploadSamplePDF.fulfilled, (state, action) => {
  state.loading = false;
  state.success = true;

  const { id, sample_pdf_url } = action.payload;

  // Update in serviceDocuments store (search in all serviceId groups)
  Object.keys(state.serviceDocuments).forEach(serviceId => {
    const index = state.serviceDocuments[serviceId].findIndex(d => d.id === id);
    if (index !== -1) {
      state.serviceDocuments[serviceId][index].sample_pdf_url = sample_pdf_url;
    }
  });
})
.addCase(uploadSamplePDF.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
})

.addCase(deleteSamplePDF.pending, (state) => {
  state.loading = true;
  state.error = null;
})

.addCase(deleteSamplePDF.fulfilled, (state, action) => {
  state.loading = false;
  const { id } = action.payload;

  // Remove sample PDF URL from the matching document
  Object.keys(state.serviceDocuments).forEach(serviceId => {
    const index = state.serviceDocuments[serviceId].findIndex(d => d.id === id);
    if (index !== -1) {
      state.serviceDocuments[serviceId][index].sample_pdf_url = null;
      state.serviceDocuments[serviceId][index].sample_pdf_signed_url = null;
    }
  });
})

.addCase(deleteSamplePDF.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});


  },
});



export const { resetSuccess } = serviceDocumentsSlice.actions;
export default serviceDocumentsSlice.reducer;
