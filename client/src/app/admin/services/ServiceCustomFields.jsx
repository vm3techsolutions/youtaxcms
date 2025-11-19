"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ServiceCustomFields({
  service,
  editField,
  onSave,
  onUpdate,
}) {
  const isEditing = !!editField;

  const [fields, setFields] = useState([]);
  const [errors, setErrors] = useState({});

  // ===========================================================
  // LOAD EDIT MODE DATA
  // ===========================================================
  useEffect(() => {
  if (editField) {
    setFields([
      {
        label: editField.label,
        type: editField.type,
        placeholder: editField.placeholder || "",
        required: !!editField.required,
        options: editField.options || [],
      },
    ]);
  }
}, [editField]);



  // ===========================================================
  // LOAD SERVICE FIELDS (ONLY WHEN NOT EDITING)
  // ===========================================================
  useEffect(() => {
    if (!editField && service?.custom_fields) {
      setFields(
        service.custom_fields.map((f) => ({
          label: f.label_name,
          type: f.input_type,
          placeholder: f.placeholder,
          required: f.is_mandatory,
          options: f.options ? f.options.split(",") : [],
        }))
      );
    }
  }, [service, editField]);

  // ===========================================================
  // Add new Field
  // ===========================================================
  const addField = () => {
    setFields([
      ...fields,
      {
        label: "",
        type: "",
        placeholder: "",
        required: false,
        options: [],
      },
    ]);
  };

  const updateField = (index, key, value) => {
    const updated = [...fields];
    updated[index][key] = value;
    setFields(updated);
  };

  const updateOption = (fIndex, oIndex, value) => {
    const updated = [...fields];
    updated[fIndex].options[oIndex] = value;
    setFields(updated);
  };

  const addOption = (index) => {
    const updated = [...fields];
    updated[index].options.push("");
    setFields(updated);
  };

  const removeOption = (fIndex, oIndex) => {
    const updated = [...fields];
    updated[fIndex].options = updated[fIndex].options.filter(
      (_, i) => i !== oIndex
    );
    setFields(updated);
  };

  const removeField = (index) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // ===========================================================
  // VALIDATION
  // ===========================================================
  const validate = () => {
    let err = {};
    fields.forEach((f, i) => {
      if (!f.label.trim()) err[i] = "Field name is required";
      else if (!f.type) err[i] = "Please select a field type";
      else if (
        ["radio", "checkbox", "dropdown"].includes(f.type) &&
        f.options.length === 0
      )
        err[i] = "Options required for this field type";
    });
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ===========================================================
  // SAVE or UPDATE
  // ===========================================================
  const handleSave = () => {
    if (!validate()) return;

    const formattedFields = fields.map((f) => ({
      label_name: f.label,
      input_type: f.type,
      placeholder: f.placeholder || null,
      is_mandatory: f.required,
      options:
  ["radio", "checkbox", "dropdown"].includes(f.type)
    ? (Array.isArray(f.options)
        ? f.options.join(",")
        : typeof f.options === "string"
          ? f.options
          : "")
    : null


    }));

    if (isEditing) {
      onUpdate(editField.id, formattedFields[0]); // only one field
    } else {
      onSave(formattedFields); // array - bulk create
    }

    setFields([]);
    setErrors({});
  };

  return (
    <div className="mt-6 p-4 border rounded bg-gray-50">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">
          {isEditing ? "Edit Field" : "Custom Fields"}
        </h3>

        {!isEditing && (
          <button
            onClick={addField}
            className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
          >
            <Plus size={14} /> Add Field
          </button>
        )}
      </div>

      {fields.map((field, index) => (
        <div key={index} className="border p-3 rounded mt-3 bg-white">
          <input
            type="text"
            placeholder="Field Name"
            value={field.label}
            onChange={(e) => updateField(index, "label", e.target.value)}
            className="border p-2 w-full"
          />

          {errors[index] && (
            <p className="text-red-600 text-sm mt-1">{errors[index]}</p>
          )}

          <select
            value={field.type}
            onChange={(e) => updateField(index, "type", e.target.value)}
            className="border p-2 w-full mt-2"
          >
            <option value="">Select Type</option>
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="radio">Radio</option>
            <option value="checkbox">Checkbox</option>
          </select>

          {["text", "textarea"].includes(field.type) && (
            <input
              type="text"
              placeholder="Placeholder"
              value={field.placeholder}
              onChange={(e) =>
                updateField(index, "placeholder", e.target.value)
              }
              className="border p-2 w-full mt-2"
            />
          )}

          <label className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) =>
                updateField(index, "required", e.target.checked)
              }
            />
            Mandatory
          </label>

          {["radio", "checkbox", "dropdown"].includes(field.type) && (
            <div className="mt-3 border p-2 rounded bg-gray-50">
              <p className="text-sm font-medium mb-2">Options</p>

              {field.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) =>
                      updateOption(index, optIndex, e.target.value)
                    }
                    placeholder={`Option ${optIndex + 1}`}
                    className="border p-2 w-full"
                  />
                  <button
                    onClick={() => removeOption(index, optIndex)}
                    className="text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addOption(index)}
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
              >
                + Add Option
              </button>
            </div>
          )}

          {!isEditing && (
            <button
              onClick={() => removeField(index)}
              className="text-red-600 mt-2 flex items-center gap-1"
            >
              <Trash2 size={14} /> Remove Field
            </button>
          )}
        </div>
      ))}

      <button
        onClick={handleSave}
        className={`${
          isEditing ? "bg-yellow-600" : "bg-green-600"
        } text-white px-4 py-2 rounded mt-4`}
      >
        {isEditing ? "Update Changes" : "Save Custom Fields"}
      </button>
    </div>
  );
}
