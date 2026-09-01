import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireSuperAdmin } from "@/lib/superadmin";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, message: auth.message },
        { status: auth.status }
      );
    }

    const users = await auth.db
      .collection("users")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const result = await Promise.all(
      users.map(async (user) => {
        let business = null;

        if (
          user.businessId &&
          ObjectId.isValid(String(user.businessId))
        ) {
          const businessDoc = await auth.db
            .collection("businesses")
            .findOne({
              _id: new ObjectId(String(user.businessId)),
            });

          if (businessDoc) {
            business = {
              id: businessDoc._id.toString(),
              name: businessDoc.name || "",
              slug: businessDoc.slug || "",
              plan: businessDoc.plan || "basico",
              active: businessDoc.active !== false,
            };
          }
        }

        return {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email || "",
          role: user.role || "",
          active: user.active !== false,
          business,
          createdAt: user.createdAt || null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      users: result,
    });
  } catch (error) {
    console.error("Erro ao listar usuários:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao listar usuários",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();

    const id = String(body.id || "");
    const active = body.active;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuário inválido",
        },
        { status: 400 }
      );
    }

    if (typeof active !== "boolean") {
      return NextResponse.json(
        {
          ok: false,
          message: "Status inválido",
        },
        { status: 400 }
      );
    }

    const target = await auth.db
      .collection("users")
      .findOne({
        _id: new ObjectId(id),
      });

    if (!target) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuário não encontrado",
        },
        { status: 404 }
      );
    }

    if (
      target._id.toString() ===
        auth.admin._id.toString() &&
      active === false
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Você não pode desativar seu próprio usuário.",
        },
        { status: 400 }
      );
    }

    await auth.db.collection("users").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          active,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: active
        ? "Usuário ativado com sucesso"
        : "Usuário desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao alterar usuário:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao alterar usuário",
      },
      { status: 500 }
    );
  }
}
