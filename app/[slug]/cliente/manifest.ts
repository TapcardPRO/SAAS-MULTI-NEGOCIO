import type { MetadataRoute } from "next";

export default async function manifest({ params }: { params: Promise<{ slug: string }> }): Promise<MetadataRoute.Manifest> {
  const { slug } = await params;
  return {
    id: `/${slug}/cliente`,
    name: "Vellto | Área do cliente",
    short_name: "Vellto Cliente",
    description: "Acesse seus agendamentos e sua área de cliente.",
    start_url: `/${slug}/cliente`,
    scope: `/${slug}/`,
    display: "standalone",
    background_color: "#071018",
    theme_color: "#8df542",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
