"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import {
  getDocumentsByOrderId,
  uploadOperationDocument,
  deleteOperationDocument,
} from "@/store/slices/operationDocumentsSlice";

export default function OperationDocumentsPopup({ orderId, onClose }) {
  const dispatch = useDispatch();

  // Redux state
  const { documents: operationDocuments, loading } = useSelector(
  (state) => state.operationDocuments
);


  // Local states for upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [remark, setRemark] = useState("");

  // Fetch documents whenever popup opens
  useEffect(() => {
    if (orderId) {
      dispatch(getDocumentsByOrderId(orderId)); // Fetch docs for this order
    }
  }, [orderId, dispatch]);

  // Upload handler
  const handleUpload = (e) => {
  e.preventDefault();   // <--- FIXED

  console.log("Uploading:", { order_id: orderId, remarks: remark, file: selectedFile });

  dispatch(
    uploadOperationDocument({
      order_id: orderId,
      remarks: remark,
      file: selectedFile,
    })
  )
    .unwrap()
    .then(() => {
      dispatch(getDocumentsByOrderId(orderId));
      setSelectedFile(null);
      setRemark("");
    })
    .catch((err) => {
      console.error("Upload failed:", err);
    });
};


  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[600px] shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">
          Documents for Order #{orderId}
        </h2>

        {/* ------------------- Upload Section ------------------- */}
        <div className="mb-6 border p-4 rounded">
          <h3 className="font-semibold mb-2 text-blue-700">Upload Document</h3>

          <input
            type="file"
            className="w-full border p-2 mb-2"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />

          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Enter remark"
            className="w-full border p-2 mb-2"
          />

          <button
            onClick={handleUpload}
            className="bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* ------------------- Uploaded Documents List ------------------- */}
        <h3 className="font-semibold text-green-700 mb-2">
          Uploaded Documents
        </h3>

        {loading ? (
          <p>Loading documents...</p>
        ) : operationDocuments.length === 0 ? (
          <p className="text-gray-500">No documents uploaded yet.</p>
        ) : (
          <table className="w-full border mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">File</th>
                <th className="border p-2">Remark</th>
                <th className="border p-2">Uploaded At</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>

            <tbody>
              {operationDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="border p-2">{doc.file_name}</td>
                  <td className="border p-2">{doc.remarks}</td>
                  <td className="border p-2">
                    {new Date(doc.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2 space-x-2">
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>

                    <button
                      onClick={() =>
                        dispatch(deleteOperationDocument(doc.id)).then(() => {
                          dispatch(getDocumentsByOrderId(orderId));
                        })
                      }
                      className="text-red-600 underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Close Button */}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
