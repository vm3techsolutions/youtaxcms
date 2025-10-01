// /app/user/documents/page.js
export const dynamic = "force-dynamic"; // prevent static prerender

import PendingPayment from "./PendingPayment";

export default function PendingPaymentPage() {
  return <PendingPayment />;
}
