import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("saas_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          authorized: false,
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifySessionToken(token);

    if (
      !session?.userId ||
      !ObjectId.isValid(session.userId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          authorized: false,
        },
        {
          status: 401,
        }
      );
    }

    const db = await getDb();

    const user = await db
      .collection("users")
      .findOne({
        _id: new ObjectId(
          session.userId
        ),
      });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          authorized: false,
        },
        {
          status: 401,
        }
      );
    }

    if (user.role !== "superadmin") {
      return NextResponse.json(
        {
          ok: false,
          authenticated: true,
          authorized: false,
          message:
            "Acesso exclusivo do Super Admin",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      authorized: true,

      user: {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email || "",
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao verificar Super Admin:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        authorized: false,
        message:
          "Erro ao verificar acesso",
      },
      {
        status: 500,
      }
    );
  }
}