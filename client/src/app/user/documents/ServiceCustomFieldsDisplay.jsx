"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getServiceInputsByService } from "@/store/slices/serviceInputSlice";

export default function ServiceCustomFieldsForm({ serviceId, onSubmit, readOnly = false, initialValues = {} }) {
    const dispatch = useDispatch();
    const { items: serviceInputs } = useSelector((state) => state.serviceInput);
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        if (serviceId) {
            dispatch(getServiceInputsByService(serviceId));
        }
    }, [serviceId, dispatch]);

    useEffect(() => {
        // Set initial values whenever they change
        setFormValues(initialValues);
    }, [initialValues]);

    const handleChange = (fieldId, value) => {
        setFormValues((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (readOnly) return;
        console.log("Submitting custom fields:", formValues);
        if (onSubmit) onSubmit(formValues); // callback to parent
        setFormValues({}); // clear fields after submit
    };

    if (!serviceInputs.length) return null;

    return (
        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
            <h3 className="text-xl font-semibold mb-4">Additional Service Fields</h3>

            {serviceInputs.map((field) => {
                const fieldKey = `field_${field.id}`;
                const value = formValues[fieldKey] || "";

                // Read-only view
                if (readOnly) {
                    return (
                        <div key={field.id} className="mb-4">
                            <label className="block font-medium mb-1">{field.label_name}:</label>
                            <p className="p-2 bg-gray-100 rounded border">{Array.isArray(value) ? value.join(", ") : value || "-"}</p>
                        </div>
                    );
                }

                return (
                    <div key={field.id} className="mb-4">
                        <label className="block font-medium mb-1">
                            {field.label_name}
                            {field.is_mandatory ? (
                                <span className="text-red-500 ml-1">*</span>
                            ) : null}
                        </label>

                        {/* Text */}
                        {field.input_type === "text" && (
                            <input
                                type="text"
                                required={field.is_mandatory}
                                placeholder={field.placeholder || ""}
                                value={value}
                                onChange={(e) => handleChange(fieldKey, e.target.value)}
                                className="border p-2 w-full rounded"
                                disabled={readOnly}
                            />
                        )}

                        {/* Textarea */}
                        {field.input_type === "textarea" && (
                            <textarea
                                required={field.is_mandatory}
                                placeholder={field.placeholder || ""}
                                value={value}
                                onChange={(e) => handleChange(fieldKey, e.target.value)}
                                className="border p-2 w-full rounded"
                                disabled={readOnly}
                            />
                        )}


                        {/* Radio, Checkbox, Dropdown */}
                        {["radio", "checkbox", "dropdown"].includes(field.input_type) && (
                            <div className="flex flex-col gap-2 mt-1">
                                {field.options?.split(",").map((opt, idx) => {
                                    if (field.input_type === "dropdown") {
                                        return (
                                            <select
                                                key={idx}
                                                required={field.is_mandatory}
                                                value={value}
                                                onChange={(e) => handleChange(fieldKey, e.target.value)}
                                                disabled={readOnly}
                                                className="border p-2 w-full rounded"
                                            >
                                                <option value="">{field.placeholder || "Select"}</option>
                                                <option value={opt}>{opt}</option>
                                            </select>
                                        );
                                    }

                                    return (
                                        <label key={idx} className="flex items-center gap-2">
                                            <input
                                                type={field.input_type}
                                                name={fieldKey}
                                                value={opt}
                                                checked={
                                                    field.input_type === "checkbox"
                                                        ? Array.isArray(value) && value.includes(opt)
                                                        : value === opt
                                                }
                                                onChange={(e) => {
                                                    if (field.input_type === "checkbox") {
                                                        const newVal = Array.isArray(value) ? [...value] : [];
                                                        if (e.target.checked) newVal.push(opt);
                                                        else newVal.splice(newVal.indexOf(opt), 1);
                                                        handleChange(fieldKey, newVal);
                                                    } else {
                                                        handleChange(fieldKey, opt);
                                                    }
                                                }}
                                                disabled={readOnly}
                                            />
                                            {opt}
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Info Note */}
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <p className="text-sm text-gray-700 leading-6">
                    <strong className="text-red-500">Important:</strong> Once this information is submitted, it cannot be modified.
                    Please verify all details carefully before proceeding.
                </p>
            </div>

            <div className="text-right mt-4">
                <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={readOnly}
                >
                    Submit
                </button>
            </div>
        </form>
    );
}
