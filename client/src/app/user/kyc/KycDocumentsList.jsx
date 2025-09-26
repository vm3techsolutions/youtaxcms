"use client";

export default function KycDocumentsList({ document }) {
  if (!document) return null;

  return (
    <div className="bg-white shadow-md rounded-2xl p-6 border">
      <h2 className="text-lg font-semibold mb-4">Uploaded Document</h2>
      <p className="text-sm"><b>Type:</b> {document.doc_type}</p>
      <p className="text-sm"><b>Status:</b> {document.status}</p>
      <a
        href={document.signed_url}
        target="_blank"
        className="mt-2 inline-block text-blue-600 underline"
      >
        View Document
      </a>
    </div>
  );
}
