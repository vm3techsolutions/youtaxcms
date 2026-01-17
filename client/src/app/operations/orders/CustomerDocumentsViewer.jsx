"use client";

import MonthlyCustomerDocuments from "./MonthlyCustomerDocuments";

export default function CustomerDocumentsViewer({ order }) {
  const allDocs = order?.order_documents || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b pb-3 mb-4">
        <h3 className="text-xl font-semibold">
          Documents – Order #{order.id}
        </h3>
        <p className="text-sm text-gray-500">
          All customer submitted documents grouped by time
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">

        {/* 🔹 All Documents Section */}
        <section>
          <h4 className="text-lg font-semibold mb-3">
            All Documents
          </h4>

          {allDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{doc.doc_name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.doc_type}
                      </p>
                    </div>

                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-500 text-sm">
              No customer documents uploaded.
            </p>
          )}
        </section>

        {/* 🔹 Monthly / Year-wise Section */}
        <section>
          <h4 className="text-lg font-semibold mb-3">
            Monthly Documents
          </h4>

          <MonthlyCustomerDocuments orderId={order.id} />
        </section>
      </div>
    </div>
  );
}
