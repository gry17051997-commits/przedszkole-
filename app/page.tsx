import { redirect } from "next/navigation";

/**
 * Strona główna – na razie kieruje do logowania.
 * Docelowo: landing page / dashboard (kolejne kroki).
 */
export default function HomePage() {
  redirect("/login");
}
