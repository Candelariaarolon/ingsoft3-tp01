import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/components/shared/AppHeader";
import FooterPublico from "@/components/landing-publica/FooterPublico";
import NuevaPublicacionForm from "@/components/publicaciones/NuevaPublicacionForm";

export default async function NuevaPublicacionPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="bg-blanco">
      <AppHeader active="publicaciones" />

      <section className="mx-auto max-w-xl px-6 py-14 md:px-12">
        <h1 className="mb-8 font-serif text-2xl text-negro">Nueva publicación</h1>
        <NuevaPublicacionForm />
      </section>

      <FooterPublico />
    </main>
  );
}
