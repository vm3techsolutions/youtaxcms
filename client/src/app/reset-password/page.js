// /app/user/documents/page.js
export const dynamic = "force-dynamic"; // prevent static prerender

import ResetPassword from './ReserPassword';

export default function DocumentsPage() {
  return <ResetPassword />;
}
