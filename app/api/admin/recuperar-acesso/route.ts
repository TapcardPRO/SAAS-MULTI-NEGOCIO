import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const expected = process.env.VELLTO_RECOVERY_KEY;

    if (!expected || expected.length < 32) {
      return NextResponse.json(
        { message: "Recuperação desabilitada" },
        { status: 503 }
      );
    }

    const supplied = request.headers.get("x-recovery-key") || "";

    const a = Buffer.from(supplied);
    const b = Buffer.from(expected);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const password = String(body.password || "");

    if (password.length < 12 || password.length > 128) {
      return NextResponse.json(
        { message: "A senha deve ter entre 12 e 128 caracteres" },
        { status: 400 }
      );
    }

    const db = await getDb();

    const admins = await db.collection("users")
      .find({ role: "superadmin" })
      .project({ _id: 1, email: 1 })
      .limit(2)
      .toArray();

    if (admins.length !== 1) {
      return NextResponse.json(
        { message: "É necessário existir exatamente um Super Admin" },
        { status: 409 }
      );
    }

    await db.collection("users").updateOne(
      { _id: admins[0]._id, role: "superadmin" },
      { $set: { passwordHash: await hashPassword(password) } }
    );

    return NextResponse.json({
      ok: true,
      email: admins[0].email,
      message: "Senha redefinida"
    });
  } catch {
    return NextResponse.json(
      { message: "Erro na recuperação" },
      { status: 500 }
    );
  }
}
