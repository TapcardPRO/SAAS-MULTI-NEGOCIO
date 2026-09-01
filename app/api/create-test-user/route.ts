import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const db = await getDb();

    const business = await db
      .collection("businesses")
      .findOne({
        slug: "engenheiros-do-corte",
      });

    if (!business) {
      return NextResponse.json(
        {
          ok: false,
          message: "Negócio não encontrado",
        },
        { status: 404 }
      );
    }

    const email = "teste@saas.com";
    const password = "123456";

    const existingUser = await db
      .collection("users")
      .findOne({
        email,
      });

    if (existingUser) {
      return NextResponse.json({
        ok: true,
        message: "Usuário de teste já existe",
        email,
        password,
      });
    }

    const passwordHash =
      await hashPassword(password);

    const result = await db
      .collection("users")
      .insertOne({
        name: "Cliente Teste",
        email,
        passwordHash,

        businessId: business._id,

        role: "owner",

        createdAt: new Date(),
        updatedAt: new Date(),
      });

    return NextResponse.json({
      ok: true,
      message: "Usuário criado com sucesso",
      userId: result.insertedId.toString(),
      email,
      password,
    });
  } catch (error) {
    console.error(
      "Erro ao criar usuário de teste:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao criar usuário de teste",
      },
      { status: 500 }
    );
  }
}