// /app/user/documents/page.js
export const dynamic = "force-dynamic"; // prevent static prerender

import PaymentSuccess from "./PaymentSuccess";

export default function PaymentSuccessPage() {
  return <PaymentSuccess />;
}
