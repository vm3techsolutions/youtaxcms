// /app/user/documents/page.js
export const dynamic = "force-dynamic"; // prevent static prerender

import DocumentUpload from "./DocumentUpload";

export default function DocumentsPage() {
  return <DocumentUpload />;
}
