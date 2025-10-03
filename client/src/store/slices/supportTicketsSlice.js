// store/slices/supportTicketsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // your axiosInstance

// Initial state
const initialState = {
  tickets: [],
  loading: false,
  error: null,
};

// ➤ Create Ticket
export const createTicket = createAsyncThunk(
  "supportTickets/create",
  async ({ subject, description, order_id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axiosInstance.post(
        "/support/ticket",
        { subject, description, order_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create ticket");
    }
  }
);

// ➤ Fetch Tickets
export const fetchTickets = createAsyncThunk(
  "supportTickets/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axiosInstance.get("/support/tickets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch tickets");
    }
  }
);

// Slice
const supportTicketsSlice = createSlice({
  name: "supportTickets",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Create ticket
    builder
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.push({
          id: action.payload.ticket_id,
          subject: action.meta.arg.subject,
          description: action.meta.arg.description,
          status: "open",
          order_id: action.meta.arg.order_id,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch tickets
    builder
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default supportTicketsSlice.reducer;
