import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import {
  hashPassword,
  verifySessionToken,
} from "@/lib/auth";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function requireSuperAdmin() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não autenticado",
    };
  }

  const session =
    await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(session.userId)
  ) {
    return {
      ok: false as const,
      status: 401,
      message: "Sessão inválida",
    };
  }

  const db = await getDb();

  const admin = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(session.userId),
    });

  if (!admin) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não encontrado",
    };
  }

  if (admin.role !== "superadmin") {
    return {
      ok: false as const,
      status: 403,
      message: "Acesso exclusivo do Super Admin",
    };
  }

  return {
    ok: true as const,
    db,
    admin,
  };
}

export async function POST(
  request: Request,
  { params }: RouteProps
) {
  try {
    const auth =
      await requireSuperAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa inválida",
        },
        {
          status: 400,
        }
      );
    }

    const business =
      await auth.db
        .collection("businesses")
        .findOne({
          _id: new ObjectId(id),
        });

    if (!business) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !business.ownerUserId ||
      !ObjectId.isValid(
        String(business.ownerUserId)
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta empresa não possui responsável vinculado",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const newPassword = String(
      body.newPassword || ""
    );

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A nova senha precisa ter pelo menos 6 caracteres",
        },
        {
          status: 400,
        }
      );
    }

    const ownerId =
      new ObjectId(
        String(business.ownerUserId)
      );

    const owner =
      await auth.db
        .collection("users")
        .findOne({
          _id: ownerId,
        });

    if (!owner) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Usuário responsável não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const passwordHash =
      await hashPassword(
        newPassword
      );

    await auth.db
      .collection("users")
      .updateOne(
        {
          _id: ownerId,
        },
        {
          $set: {
            passwordHash,
            updatedAt: new Date(),
          },
        }
      );

    return NextResponse.json({
      ok: true,
      message:
        "Senha redefinida com sucesso",
    });
  } catch (error) {
    console.error(
      "Erro ao redefinir senha:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao redefinir senha",
      },
      {
        status: 500,
      }
    );
  }
}