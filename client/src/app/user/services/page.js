"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices } from "@/store/slices/servicesSlice";
import { fetchDocumentsByService } from "@/store/slices/serviceDocumentsSlice";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesFlex() {
  const dispatch = useDispatch();
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
  } = useSelector((state) => state.services);
  const { serviceDocuments } = useSelector((state) => state.serviceDocuments);

  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  const handleToggle = async (serviceId) => {
    if (expanded === serviceId) {
      setExpanded(null);
      return;
    }

    setExpanded(serviceId);

    // Fetch documents only if not already present in state
    if (!serviceDocuments[serviceId]) {
      await dispatch(fetchDocumentsByService(serviceId));
    }
  };

  if (servicesLoading)
    return <p className="text-center">Loading services...</p>;
  if (servicesError)
    return <p className="text-center text-red-500">{servicesError}</p>;

  return (
    <div className="container mx-auto py-4 px-4">
      <div className="flex flex-wrap justify-center gap-6 items-start">
        {services.map((service, index) => {
          const isExpanded = expanded === service.id;
          const documents = Array.isArray(serviceDocuments[service.id])
            ? serviceDocuments[service.id]
            : [];

          return (
            <motion.div
              key={service.id}
              onClick={() => handleToggle(service.id)}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white shadow-md rounded-xl cursor-pointer overflow-hidden flex flex-col transition-all duration-300 w-[300px]"
            >
              <div className="p-6 text-center font-semibold text-xl secondaryText">
                {service.name}
              </div>

              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{
                  height: isExpanded ? "auto" : 0,
                  opacity: isExpanded ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="text-center flex flex-col items-start justify-center "
              >
                {isExpanded && (
                  <>
                    {documents.length === 0 ? (
                      <p className="px-8 mb-8">Not Uploaded</p>
                    ) : (
                      <div className="w-full px-8 py-2">
                        <h3 className="font-semibold mb-2 text-left text-gray-800">
                          Documents Required
                        </h3>
                        <ol className="list-decimal text-left text-gray-700 list-inside mb-4">
                          {documents.map((doc) => (
                            <li key={doc.id}>{doc.doc_name}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="w-full flex justify-center">
                      <Link
                        href={`/services/${service.id}`}
                        className="px-4 py-2 mb-6 primary-btn text-white rounded-lg  transition"
                      >
                        Apply Now
                      </Link>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
