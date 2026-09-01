import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuthenticatedBusiness(slug: string) {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const session =
    await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(session.userId)
  ) {
    return {
      error: NextResponse.json(
        {
          message: "Sessão inválida",
        },
        {
          status: 401,
        }
      ),
    };
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
    return {
      error: NextResponse.json(
        {
          message: "Usuário não encontrado",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (user.active === false) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário bloqueado",
        },
        {
          status: 403,
        }
      ),
    };
  }

  if (
    user.role !== "owner" &&
    user.role !== "employee"
  ) {
    return {
      error: NextResponse.json(
        {
          message: "Acesso não autorizado",
        },
        {
          status: 403,
        }
      ),
    };
  }

  if (!user.businessId) {
    return {
      error: NextResponse.json(
        {
          message:
            "Usuário sem empresa vinculada",
        },
        {
          status: 400,
        }
      ),
    };
  }

  const businessIdString =
    String(user.businessId);

  if (
    !ObjectId.isValid(
      businessIdString
    )
  ) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa inválida",
        },
        {
          status: 400,
        }
      ),
    };
  }

  const businessId =
    new ObjectId(
      businessIdString
    );

  const business = await db
    .collection("businesses")
    .findOne({
      _id: businessId,
    });

  if (!business) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa não encontrada",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (business.active === false) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa bloqueada",
        },
        {
          status: 403,
        }
      ),
    };
  }

  if (business.slug !== slug) {
    return {
      error: NextResponse.json(
        {
          message:
            "Você não possui acesso a esta empresa",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    db,
    user,
    business,
    businessId,
  };
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } =
      await context.params;

    const auth =
      await getAuthenticatedBusiness(
        slug
      );

    if ("error" in auth) {
      return auth.error;
    }

    const {
      db,
      businessId,
    } = auth;

    const professionals = await db
      .collection("professionals")
      .find({
        $or: [
          {
            businessId,
          },
          {
            businessId:
              businessId.toString(),
          },
          {
            businessSlug: slug,
          },
        ],
      })
      .sort({
        order: 1,
        name: 1,
      })
      .toArray();

    return NextResponse.json({
      professionals:
        professionals.map(
          (professional) => ({
            _id:
              professional._id.toString(),

            name:
              professional.name ||
              "",

            role:
              professional.role ||
              "",

            description:
              professional.description ||
              "",

            photoUrl:
              professional.photoUrl ||
              "",

            active:
              professional.active !==
              false,

            order:
              professional.order || 0,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Erro ao carregar profissionais:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar profissionais",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } =
      await context.params;

    const auth =
      await getAuthenticatedBusiness(
        slug
      );

    if ("error" in auth) {
      return auth.error;
    }

    const {
      db,
      businessId,
    } = auth;

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const role =
      String(
        body.role || ""
      ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const photoUrl =
      String(
        body.photoUrl || ""
      ).trim();

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do profissional",
        },
        {
          status: 400,
        }
      );
    }

    const lastProfessional =
      await db
        .collection(
          "professionals"
        )
        .find({
          $or: [
            {
              businessId,
            },
            {
              businessId:
                businessId.toString(),
            },
            {
              businessSlug: slug,
            },
          ],
        })
        .sort({
          order: -1,
        })
        .limit(1)
        .toArray();

    const nextOrder =
      lastProfessional.length >
      0
        ? Number(
            lastProfessional[0]
              .order || 0
          ) + 1
        : 0;

    const now = new Date();

    const professional = {
      businessId,
      businessSlug: slug,

      name,
      role,
      description,
      photoUrl,

      active:
        body.active !== false,

      order: nextOrder,

      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("professionals")
      .insertOne(
        professional
      );

    return NextResponse.json(
      {
        message:
          "Profissional criado com sucesso",

        professional: {
          _id:
            result.insertedId.toString(),

          ...professional,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao criar profissional:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao criar profissional",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } =
      await context.params;

    const auth =
      await getAuthenticatedBusiness(
        slug
      );

    if ("error" in auth) {
      return auth.error;
    }

    const {
      db,
      businessId,
    } = auth;

    const body =
      await request.json();

    const id =
      String(
        body._id ||
          body.id ||
          ""
      );

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          message:
            "Profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

    const professional =
      await db
        .collection(
          "professionals"
        )
        .findOne({
          _id: new ObjectId(id),

          $or: [
            {
              businessId,
            },
            {
              businessId:
                businessId.toString(),
            },
            {
              businessSlug: slug,
            },
          ],
        });

    if (!professional) {
      return NextResponse.json(
        {
          message:
            "Profissional não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const update: Record<
      string,
      unknown
    > = {
      updatedAt: new Date(),
    };

    if (
      typeof body.name ===
      "string"
    ) {
      const name =
        body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            message:
              "Informe o nome do profissional",
          },
          {
            status: 400,
          }
        );
      }

      update.name = name;
    }

    if (
      typeof body.role ===
      "string"
    ) {
      update.role =
        body.role.trim();
    }

    if (
      typeof body.description ===
      "string"
    ) {
      update.description =
        body.description.trim();
    }

    if (
      typeof body.photoUrl ===
      "string"
    ) {
      update.photoUrl =
        body.photoUrl.trim();
    }

    if (
      typeof body.active ===
      "boolean"
    ) {
      update.active =
        body.active;
    }

    if (
      typeof body.order ===
      "number"
    ) {
      update.order =
        body.order;
    }

    update.businessId =
      businessId;

    update.businessSlug =
      slug;

    await db
      .collection(
        "professionals"
      )
      .updateOne(
        {
          _id:
            professional._id,
        },
        {
          $set: update,
        }
      );

    return NextResponse.json({
      message:
        "Profissional atualizado com sucesso",
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar profissional:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao atualizar profissional",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } =
      await context.params;

    const auth =
      await getAuthenticatedBusiness(
        slug
      );

    if ("error" in auth) {
      return auth.error;
    }

    const {
      db,
      businessId,
    } = auth;

    const body =
      await request.json();

    const id =
      String(
        body._id ||
          body.id ||
          ""
      );

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          message:
            "Profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

    const result = await db
      .collection(
        "professionals"
      )
      .deleteOne({
        _id: new ObjectId(id),

        $or: [
          {
            businessId,
          },
          {
            businessId:
              businessId.toString(),
          },
          {
            businessSlug: slug,
          },
        ],
      });

    if (
      result.deletedCount === 0
    ) {
      return NextResponse.json(
        {
          message:
            "Profissional não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      message:
        "Profissional removido com sucesso",
    });
  } catch (error) {
    console.error(
      "Erro ao remover profissional:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao remover profissional",
      },
      {
        status: 500,
      }
    );
  }
}