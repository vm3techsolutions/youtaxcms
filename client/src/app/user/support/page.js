"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createTicket, fetchTickets } from "@/store/slices/supportTicketsSlice";
import { PlusCircle } from "lucide-react";

export default function SupportTickets() {
  const dispatch = useDispatch();
  const { tickets, loading, error } = useSelector((state) => state.supportTickets);

  const [form, setForm] = useState({
    subject: "",
    description: "",
    order_id: "",
  });

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) {
      alert("Subject and description are required");
      return;
    }

    await dispatch(createTicket(form));
    setForm({ subject: "", description: "", order_id: "" });
    dispatch(fetchTickets());
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}

      {/* Form Card */}
      <div className="bg-white from-indigo-50 to-purple-50 p-6 rounded-xl shadow-lg mb-8">
              <h2 className="text-3xl font-extrabold mb-6 text-gray-900 border-b pb-2">Support Tickets</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="Subject"
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none transition"
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe your issue..."
            rows={4}
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none transition resize-none"
          />
          <input
            type="text"
            name="order_id"
            value={form.order_id}
            onChange={handleChange}
            placeholder="Order ID (optional)"
            className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none transition"
          />
          <button
            type="submit"
            className="primary-btn text-white font-semibold px-6 py-3 rounded-lg w-max self-end transition-all duration-300 shadow-md hover:shadow-lg"
          >
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      </div>

      {/* Tickets List */}
      <h3 className="text-2xl font-semibold mb-4 text-gray-900">Your Tickets</h3>
      {loading && <p className="text-gray-500">Loading tickets...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid gap-4">
        {tickets.length === 0 && <p className="text-gray-500">No tickets found.</p>}
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="bg-white border border-gray-200 p-5 rounded-xl shadow-md hover:shadow-lg transition hover:scale-[1.02]"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-lg text-gray-900">{ticket.subject}</p>
                <p className="text-gray-600 mt-1">{ticket.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium 
                ${ticket.status === "open" ? "bg-green-100 text-green-800" :
                  ticket.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                  ticket.status === "resolved" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-800"}`}>
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-gray-400 text-sm flex justify-between mt-2">
              <span>Order ID: {ticket.order_id || "-"}</span>
              <span>{new Date(ticket.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
