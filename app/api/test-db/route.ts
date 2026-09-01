import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    await db.command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      message: "MongoDB conectado com sucesso",
      database: db.databaseName,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao conectar com MongoDB",
      },
      { status: 500 }
    );
  }
}