import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

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

export async function GET(
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

    let owner = null;

    if (
      business.ownerUserId &&
      ObjectId.isValid(
        String(business.ownerUserId)
      )
    ) {
      const ownerUser =
        await auth.db
          .collection("users")
          .findOne({
            _id: new ObjectId(
              String(business.ownerUserId)
            ),
          });

      if (ownerUser) {
        owner = {
          id: ownerUser._id.toString(),
          name: ownerUser.name || "",
          email: ownerUser.email || "",
          active:
            ownerUser.active !== false,
        };
      }
    }

    return NextResponse.json({
      ok: true,

      business: {
        id: business._id.toString(),
        name: business.name || "",
        slug: business.slug || "",
        category: business.category || "",
        whatsapp: business.whatsapp || "",
        plan: business.plan || "basico",
        active: business.active !== false,
        owner,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar empresa:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao buscar empresa",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
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

    const body = await request.json();

    const updateData: Record<
      string,
      unknown
    > = {
      updatedAt: new Date(),
    };

    if (body.plan !== undefined) {
      const plan = String(body.plan);

      const selectedPlan =
        await auth.db
          .collection("saas_plans")
          .findOne({
            slug: plan,
            active: { $ne: false },
          });

      if (!selectedPlan) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "O plano selecionado não existe ou está desativado.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.plan = plan;
    }

    if (body.active !== undefined) {
      updateData.active =
        Boolean(body.active);
    }

    await auth.db
      .collection("businesses")
      .updateOne(
        {
          _id: business._id,
        },
        {
          $set: updateData,
        }
      );

    /*
     * Se a empresa for bloqueada,
     * também bloqueamos o usuário dono.
     *
     * Se for reativada,
     * reativamos o dono.
     */
    if (
      body.active !== undefined &&
      business.ownerUserId &&
      ObjectId.isValid(
        String(business.ownerUserId)
      )
    ) {
      await auth.db
        .collection("users")
        .updateOne(
          {
            _id: new ObjectId(
              String(business.ownerUserId)
            ),
          },
          {
            $set: {
              active:
                Boolean(body.active),
              updatedAt: new Date(),
            },
          }
        );
    }

    const updatedBusiness =
      await auth.db
        .collection("businesses")
        .findOne({
          _id: business._id,
        });

    let owner = null;

    if (
      updatedBusiness?.ownerUserId &&
      ObjectId.isValid(
        String(
          updatedBusiness.ownerUserId
        )
      )
    ) {
      const ownerUser =
        await auth.db
          .collection("users")
          .findOne({
            _id: new ObjectId(
              String(
                updatedBusiness.ownerUserId
              )
            ),
          });

      if (ownerUser) {
        owner = {
          id: ownerUser._id.toString(),
          name: ownerUser.name || "",
          email: ownerUser.email || "",
          active:
            ownerUser.active !== false,
        };
      }
    }

    return NextResponse.json({
      ok: true,

      message:
        "Empresa atualizada com sucesso",

      business: {
        id:
          updatedBusiness?._id.toString() ||
          id,

        name:
          updatedBusiness?.name || "",

        slug:
          updatedBusiness?.slug || "",

        category:
          updatedBusiness?.category || "",

        whatsapp:
          updatedBusiness?.whatsapp || "",

        plan:
          updatedBusiness?.plan ||
          "basico",

        active:
          updatedBusiness?.active !==
          false,

        owner,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar empresa:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar empresa",
      },
      {
        status: 500,
      }
    );
  }
}