import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/components/shared/AppHeader";
import FooterPublico from "@/components/landing-publica/FooterPublico";
import MisPublicacionesContent from "@/components/publicaciones/MisPublicacionesContent";

export default async function MisPublicacionesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="bg-blanco">
      <AppHeader active="publicaciones" />
      <MisPublicacionesContent />
      <FooterPublico />
    </main>
  );
}
