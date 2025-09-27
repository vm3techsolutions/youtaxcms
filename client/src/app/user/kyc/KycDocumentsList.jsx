"use client";

export default function KycDocumentsList({ document }) {
  if (!document) return <p>No documents uploaded.</p>;

  return (
    <div className="overflow-x-auto bg-white p-2 rounded-xl">
      <table className="min-w-full  border-collapse">
        <thead>
          <tr>
            <th className="py-3 px-6 text-left border-r border-gray-300">Sr. No</th>
            <th className="py-3 px-6 text-left border-r border-gray-300">Document Name</th>
            <th className="py-3 px-6 text-left border-r border-gray-300">Status</th>
            <th className="py-3 px-6 text-left border-r border-gray-300">Created Date</th>
            <th className="py-3 px-6 text-left border-b  border-gray-300">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr className="hover:bg-gray-50 border-b border-gray-300">
            <td className="py-3 px-6 border-t border-b border-gray-300">1</td>
            <td className="py-3 px-6 border border-gray-300">{document.doc_type}</td>
            <td className="py-3 px-6 border border-gray-300">{document.status}</td>
            <td className="py-3 px-6 border border-gray-300">
              {document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : "-"}
            </td>
            <td className="py-3 px-6 border-t border-b border-gray-300">
              <a
                href={document.signed_url}
                target="_blank"
                className="text-blue-600 underline"
              >
                View
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
