// /app/user/downloads/page.js
export const dynamic = "force-dynamic"; // prevent static prerender

import Downloads from "./Downloads";

export default function PendingPaymentPage() {
  return <Downloads />;
}
