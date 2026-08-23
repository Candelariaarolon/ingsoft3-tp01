import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AppHeader from "@/components/shared/AppHeader";
import FooterPublico from "@/components/landing-publica/FooterPublico";
import BuscarPorFotoForm from "@/components/buscar/BuscarPorFotoForm";

export default async function BuscarPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <main className="bg-blanco">
      <AppHeader active="buscar" />

      <section className="mx-auto max-w-6xl px-6 py-14 md:px-12">
        <h1 className="mb-2 font-serif text-2xl text-negro">Buscar por foto</h1>
        <p className="mb-8 text-[13px] text-negro/60">
          Subí una foto de la prenda que buscás y te mostramos las publicaciones más
          parecidas de la comunidad.
        </p>
        <BuscarPorFotoForm />
      </section>

      <FooterPublico />
    </main>
  );
}
