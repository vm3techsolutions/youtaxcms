"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createCategory,
  updateCategory,
  clearCategoryState,
  fetchCategories,
} from "@/store/slices/categorySlice";

const CreateCategoryForm = ({ onSuccess, editCategory = null }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.category);

  // ✅ Pre-fill form when editing
  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name || "");
      setDescription(editCategory.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [editCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let result;
      if (editCategory) {
        // ✅ Update existing category
        result = await dispatch(
          updateCategory({ id: editCategory.id, data: { name, description } })
        ).unwrap();
      } else {
        // ✅ Create new category
        result = await dispatch(createCategory({ name, description })).unwrap();
      }

      if (result) {
        // ✅ Reset form fields
        setName("");
        setDescription("");

        // ✅ Refresh list instantly
        dispatch(fetchCategories());

        // ✅ Notify parent (for toggling back or re-render)
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Error saving category:", err);
    }
  };

  // ✅ Auto-clear messages after 3s
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => dispatch(clearCategoryState()), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4">
        {editCategory ? "Edit Category" : "Create New Category"}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Category Name */}
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            Category Name
          </label>
          <input
            type="text"
            placeholder="Enter category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E123A]"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            Description
          </label>
          <textarea
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E123A]"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-[#1E123A] text-white px-4 py-2 rounded-lg hover:bg-[#2c1e5d] transition-all disabled:bg-gray-400"
        >
          {loading
            ? editCategory
              ? "Updating..."
              : "Creating..."
            : editCategory
            ? "Update Category"
            : "Create Category"}
        </button>
      </form>

      {/* Status Messages */}
      {success && <p className="text-green-600 mt-3">{success}</p>}
      {error && <p className="text-red-600 mt-3">{error}</p>}
    </div>
  );
};

export default CreateCategoryForm;
