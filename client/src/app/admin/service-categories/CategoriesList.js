"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, deleteCategory } from "@/store/slices/categorySlice";
import { Edit, Trash2 } from "lucide-react";
import CreateCategoryForm from "./CreateCategoryForm";
import { fetchServices } from "@/store/slices/servicesSlice";

const CategoriesList = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector((state) => state.category);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const { services } = useSelector((state) => state.services);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchServices());
  }, [dispatch]);

  // Count Services by category
  const serviceCountByCategory = {};

services.forEach((service) => {
  const catId = service.category_id;
  if (catId) {
    serviceCountByCategory[catId] = (serviceCountByCategory[catId] || 0) + 1;
  }
});


  // Refresh list when category is added or edited
  const handleCategorySaved = () => {
    setShowCategoryForm(false);
    setEditingCategory(null);
    dispatch(fetchCategories());
  };

  const handleEditClick = (category) => {
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  if (loading) return <p className="text-center mt-6">Loading categories...</p>;
  if (error)
    return <p className="text-center text-red-600 mt-6">Error: {error}</p>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          {showCategoryForm
            ? editingCategory
              ? "Edit Category"
              : "Create New Category"
            : "All Categories"}
        </h2>
        {!showCategoryForm ? (
          <button
            onClick={() => {
              setShowCategoryForm(true);
              setEditingCategory(null);
            }}
            className="flex items-center gap-2 bg-[#1E123A] text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-[#2c1e5d] transition-all"
          >
            Add New Category
          </button>
        ) : (
          <button
            onClick={() => {
              setShowCategoryForm(false);
              setEditingCategory(null);
            }}
            className="flex items-center gap-2 bg-gray-500 text-white font-bold px-4 py-2 rounded-lg shadow hover:bg-gray-600 transition-all"
          >
            Back to List
          </button>
        )}
      </div>

      {/* Toggle between Form and List */}
      {showCategoryForm ? (
        <CreateCategoryForm
          onSuccess={handleCategorySaved}
          editCategory={editingCategory}
        />
      ) : categories.length === 0 ? (
        <p className="text-gray-600">No categories found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-left text-gray-700">
              <tr>
                <th className="px-4 py-3 border-b text-center w-16">#</th>
                <th className="px-4 py-3 border-b">Name</th>
                <th className="px-4 py-3 border-b">Description</th>
                <th className="px-4 py-3 border-b text-center">Services</th>
                <th className="px-4 py-3 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, index) => (
                <tr
                  key={cat.id}
                  className="hover:bg-gray-50 transition-colors border-b"
                >
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {cat.description || "—"}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-800">
                    {serviceCountByCategory[cat.id] || 0}
                  </td>
                  <td className="px-4 py-3 flex items-center justify-center gap-3">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => handleEditClick(cat)}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => handleDeleteClick(cat.id, cat.name)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategoriesList;
