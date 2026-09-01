import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const db = await getDb();

    const email = "admin@saas.com";
    const password = "123456";

    const existingUser = await db
      .collection("users")
      .findOne({
        email,
      });

    if (existingUser) {
      await db
        .collection("users")
        .updateOne(
          {
            _id: existingUser._id,
          },
          {
            $set: {
              role: "superadmin",
              updatedAt: new Date(),
            },
          }
        );

      return NextResponse.json({
        ok: true,
        message:
          "Usuário já existia e foi atualizado para Super Admin.",
        email,
      });
    }

    const passwordHash =
      await hashPassword(password);

    const now = new Date();

    await db
      .collection("users")
      .insertOne({
        name: "Super Admin",
        email,
        passwordHash,
        role: "superadmin",

        businessId: null,

        active: true,

        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json({
      ok: true,
      message:
        "Super Admin criado com sucesso.",
      email,
    });
  } catch (error) {
    console.error(
      "Erro ao criar Super Admin:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao criar Super Admin",
      },
      {
        status: 500,
      }
    );
  }
}