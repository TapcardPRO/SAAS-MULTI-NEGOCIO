import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

type RouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getAuthenticatedBusiness(slug: string) {
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

  if (!session?.userId) {
    return {
      ok: false as const,
      status: 401,
      message: "Sessão inválida",
    };
  }

  const userId = session.userId;

  if (!ObjectId.isValid(userId)) {
    return {
      ok: false as const,
      status: 401,
      message: "Sessão inválida",
    };
  }

  const db = await getDb();

  const user = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(userId),
    });

  if (!user) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não encontrado",
    };
  }

  if (!user.businessId) {
    return {
      ok: false as const,
      status: 403,
      message:
        "Usuário não possui empresa vinculada",
    };
  }

  const businessId = String(
    user.businessId
  );

  if (!ObjectId.isValid(businessId)) {
    return {
      ok: false as const,
      status: 403,
      message: "Empresa inválida",
    };
  }

  const business = await db
    .collection("businesses")
    .findOne({
      _id: new ObjectId(businessId),
    });

  if (!business) {
    return {
      ok: false as const,
      status: 404,
      message: "Empresa não encontrada",
    };
  }

  if (business.slug !== slug) {
    return {
      ok: false as const,
      status: 403,
      message:
        "Você não tem permissão para acessar esta empresa",
    };
  }

  return {
    ok: true as const,
    db,
    user,
    business,
  };
}

export async function GET(
  request: Request,
  { params }: RouteProps
) {
  try {
    const { slug } = await params;

    const auth =
      await getAuthenticatedBusiness(slug);

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

    return NextResponse.json({
      ok: true,
      business: auth.business,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar negócio:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao buscar negócio",
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
    const { slug } = await params;

    const auth =
      await getAuthenticatedBusiness(slug);

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

    const body = await request.json();

    const updateData: Record<
      string,
      unknown
    > = {
      updatedAt: new Date(),
    };

    const allowedFields = [
      "name",
      "category",
      "description",
      "whatsapp",
      "instagram",
      "address",

      "primaryColor",
      "secondaryColor",
      "backgroundColor",
      "textColor",

      "logoUrl",
      "coverUrl",
      "gallery",

      "mainButtonText",
      "mainButtonType",
      "mainButtonUrl",

      "servicesTitle",

      "showProfessionals",

      "showBookingSection",
      "bookingSectionLabel",
      "bookingSectionTitle",
      "bookingSectionDescription",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] =
          body[field];
      }
    }

    if (
      updateData.gallery !== undefined &&
      !Array.isArray(updateData.gallery)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Galeria inválida",
        },
        {
          status: 400,
        }
      );
    }

    const allowedButtonTypes = [
      "booking",
      "whatsapp",
      "link",
    ];

    if (
      updateData.mainButtonType !== undefined &&
      !allowedButtonTypes.includes(
        String(updateData.mainButtonType)
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Tipo de botão inválido",
        },
        {
          status: 400,
        }
      );
    }

    const result = await auth.db
      .collection("businesses")
      .updateOne(
        {
          _id: auth.business._id,
        },
        {
          $set: updateData,
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Negócio não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const business =
      await auth.db
        .collection("businesses")
        .findOne({
          _id: auth.business._id,
        });

    return NextResponse.json({
      ok: true,
      message:
        "Página atualizada com sucesso",
      business,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar negócio:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar negócio",
      },
      {
        status: 500,
      }
    );
  }
}