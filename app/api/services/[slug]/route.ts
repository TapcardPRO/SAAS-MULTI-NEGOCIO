import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

async function getAuthenticatedBusiness(
  requestedSlug: string
) {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { message: "Usuário não autenticado" },
        { status: 401 }
      ),
    };
  }

  const session =
    await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(String(session.userId))
  ) {
    return {
      error: NextResponse.json(
        { message: "Sessão inválida" },
        { status: 401 }
      ),
    };
  }

  const db = await getDb();

  const user = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(
        String(session.userId)
      ),
    });

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
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
        { status: 400 }
      ),
    };
  }

  const businessId =
    new ObjectId(
      String(user.businessId)
    );

  const business = await db
    .collection("businesses")
    .findOne({
      _id: businessId,
    });

  if (!business) {
    return {
      error: NextResponse.json(
        { message: "Empresa não encontrada" },
        { status: 404 }
      ),
    };
  }

  if (
    business.slug &&
    String(business.slug) !==
      requestedSlug
  ) {
    return {
      error: NextResponse.json(
        {
          message:
            "Você não tem acesso a esta empresa",
        },
        { status: 403 }
      ),
    };
  }

  return {
    db,
    business,
    businessId,
  };
}

function getTenantFilters(
  businessId: ObjectId,
  businessSlug?: string
) {
  const filters: any[] = [
    { businessId },
    {
      businessId:
        businessId.toString(),
    },
  ];

  if (businessSlug) {
    filters.push({
      businessSlug,
    });
  }

  return filters;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
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
      business,
      businessId,
    } = auth;

    const services = await db
      .collection("services")
      .find({
        $or:
          getTenantFilters(
            businessId,
            business.slug
          ),
      })
      .sort({
        order: 1,
        name: 1,
      })
      .toArray();

    return NextResponse.json({
      services:
        services.map(
          serializeService
        ),
    });
  } catch (error) {
    console.error(
      "GET SERVICES ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar serviços",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
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
      business,
      businessId,
    } = auth;

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const price =
      Number(body.price);

    const duration =
      Number(body.duration);

    const photoUrl =
      String(
        body.photoUrl || ""
      ).trim();

    const active =
      body.active !== false;

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do serviço",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Informe um valor válido",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Informe uma duração válida",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const service = {
      businessId,
      businessSlug:
        business.slug || "",
      name,
      description,
      price,
      duration,
      photoUrl,
      active,
      order: 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("services")
      .insertOne(service);

    return NextResponse.json(
      {
        message:
          "Serviço criado com sucesso",
        service:
          serializeService({
            ...service,
            _id:
              result.insertedId,
          }),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST SERVICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao criar serviço",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
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
      business,
      businessId,
    } = auth;

    const body =
      await request.json();

    const id =
      String(
        body.id || ""
      ).trim();

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          message:
            "Serviço inválido",
        },
        { status: 400 }
      );
    }

    const existing = await db
      .collection("services")
      .findOne({
        _id:
          new ObjectId(id),

        $or:
          getTenantFilters(
            businessId,
            business.slug
          ),
      });

    if (!existing) {
      return NextResponse.json(
        {
          message:
            "Serviço não encontrado",
        },
        { status: 404 }
      );
    }

    const update: any = {
      updatedAt:
        new Date(),
    };

    if (
      body.name !== undefined
    ) {
      update.name =
        String(
          body.name
        ).trim();
    }

    if (
      body.description !==
      undefined
    ) {
      update.description =
        String(
          body.description
        ).trim();
    }

    if (
      body.price !== undefined
    ) {
      update.price =
        Number(body.price);
    }

    if (
      body.duration !== undefined
    ) {
      update.duration =
        Number(
          body.duration
        );
    }

    if (
      body.photoUrl !== undefined
    ) {
      update.photoUrl =
        String(
          body.photoUrl
        ).trim();
    }

    if (
      typeof body.active ===
      "boolean"
    ) {
      update.active =
        body.active;
    }

    await db
      .collection("services")
      .updateOne(
        {
          _id:
            existing._id,
        },
        {
          $set:
            update,
        }
      );

    return NextResponse.json({
      message:
        "Serviço atualizado com sucesso",
    });
  } catch (error) {
    console.error(
      "PUT SERVICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao atualizar serviço",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
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
      business,
      businessId,
    } = auth;

    const url =
      new URL(request.url);

    const id =
      String(
        url.searchParams.get("id") ||
          ""
      ).trim();

    if (
      !id ||
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          message:
            "Serviço inválido",
        },
        { status: 400 }
      );
    }

    const result = await db
      .collection("services")
      .deleteOne({
        _id:
          new ObjectId(id),

        $or:
          getTenantFilters(
            businessId,
            business.slug
          ),
      });

    if (!result.deletedCount) {
      return NextResponse.json(
        {
          message:
            "Serviço não encontrado",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        "Serviço excluído com sucesso",
    });
  } catch (error) {
    console.error(
      "DELETE SERVICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao excluir serviço",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(
    null,
    {
      status: 204,
      headers: {
        Allow:
          "GET, POST, PUT, DELETE, OPTIONS",
      },
    }
  );
}

function serializeService(
  service: any
) {
  return {
    _id:
      service._id?.toString?.() ||
      String(
        service._id || ""
      ),

    name:
      String(
        service.name || ""
      ),

    description:
      String(
        service.description || ""
      ),

    price:
      Number(
        service.price || 0
      ),

    duration:
      Number(
        service.duration || 30
      ),

    photoUrl:
      String(
        service.photoUrl || ""
      ),

    active:
      service.active !== false,

    order:
      Number(
        service.order || 0
      ),
  };
}
