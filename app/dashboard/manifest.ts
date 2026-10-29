import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "Vellto | Painel profissional",
    short_name: "Vellto Profissional",
    description: "Acesse sua agenda e o painel profissional da Vellto.",
    start_url: "/dashboard/agenda",
    scope: "/dashboard/",
    display: "standalone",
    background_color: "#071018",
    theme_color: "#8df542",
    icons: [{ src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}
