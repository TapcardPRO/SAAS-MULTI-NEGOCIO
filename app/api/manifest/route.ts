import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const slug = searchParams.get("slug")?.trim() || "";

  const validSlug = /^[a-zA-Z0-9_-]{1,100}$/.test(slug);
  if (area !== "profissional" && !validSlug) {
    return NextResponse.json({ error: "Manifesto inválido." }, { status: 400 });
  }

  const base = {
    display: "standalone",
    background_color: "#071018",
    theme_color: "#8df542",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };

  if (area === "profissional") {
    return NextResponse.json({
      ...base,
      id: "/dashboard",
      name: "Vellto | Painel profissional",
      short_name: "Vellto Profissional",
      description: "Acesse sua agenda e o painel profissional da Vellto.",
      start_url: "/dashboard/agenda",
      scope: "/dashboard/",
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (area === "cliente") {
    return NextResponse.json({
      ...base,
      id: `/${slug}/cliente`,
      name: "Vellto | Área do cliente",
      short_name: "Vellto Cliente",
      description: "Acesse seus agendamentos e sua área de cliente.",
      start_url: `/${slug}/cliente`,
      scope: `/${slug}/`,
    }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json({
    ...base,
    id: `/${slug}`,
    name: "Vellto | Agendamento",
    short_name: "Agendar",
    description: "Acesse a página pública de agendamento.",
    start_url: `/${slug}`,
    scope: `/${slug}/`,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
