import type { MetadataRoute } from "next";

export default async function manifest({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Manifest> {
  const { slug } = await params;
  return {
    id: `/${slug}`,
    name: "Vellto | Agendamento",
    short_name: "Agendar",
    description: "Acesse a página pública de agendamento.",
    start_url: `/${slug}`,
    scope: `/${slug}/`,
    display: "standalone",
    background_color: "#071018",
    theme_color: "#8df542",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
