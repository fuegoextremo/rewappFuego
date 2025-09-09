import { redirect } from "next/navigation";

// Redirección automática a la versión clásica
export default function ClientCouponsPage() {
  redirect('/classicapp/coupons');
}

