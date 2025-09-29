// /app/user/documents/page.js
export const dynamic = "force-dynamic"; // prevent static prerender

import PaymentPage from "./PaymentPage";

export default function Page() {
  return <PaymentPage />;
}
