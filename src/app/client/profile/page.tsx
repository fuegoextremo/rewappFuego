// src/app/client/profile/page.tsx
import { redirect } from "next/navigation";

// Redirección automática a la versión clásica
export default function ClientProfilePage() {
  redirect('/classicapp/profile');
}