import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    const businesses = [
      {
        slug: "engenheiros-do-corte",
        name: "Engenheiros do Corte",
        category: "Barbearia",
        description:
          "Mais que um corte, uma experiência. Atendimento de qualidade, profissionais especializados e um espaço pensado para você.",
        whatsapp: "(21) 99999-9999",
        instagram: "@engenheirosdocorte",
        address: "Rio de Janeiro - RJ",

        logoText: "EC",

        primaryColor: "#22c55e",
        secondaryColor: "#18181b",
        backgroundColor: "#09090b",
        textColor: "#ffffff",

        logoUrl: "",
        coverUrl: "",
        gallery: [],

        createdAt: new Date(),
        updatedAt: new Date(),
      },

      {
        slug: "studio-bella",
        name: "Studio Bella",
        category: "Manicure",
        description:
          "Beleza, cuidado e autoestima em cada detalhe. Atendimento personalizado para unhas impecáveis.",
        whatsapp: "(21) 98888-7777",
        instagram: "@studiobella",
        address: "Rio de Janeiro - RJ",

        logoText: "SB",

        primaryColor: "#ec4899",
        secondaryColor: "#fdf2f8",
        backgroundColor: "#ffffff",
        textColor: "#18181b",

        logoUrl: "",
        coverUrl: "",
        gallery: [],

        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const business of businesses) {
      await db.collection("businesses").updateOne(
        { slug: business.slug },
        {
          $set: business,
        },
        {
          upsert: true,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Negócios gravados no MongoDB com sucesso",
      total: businesses.length,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao gravar negócios no MongoDB",
      },
      { status: 500 }
    );
  }
}