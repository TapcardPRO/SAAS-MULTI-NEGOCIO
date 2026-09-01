import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("saas_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Não autenticado",
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
          message: "Sessão inválida",
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
        _id: new ObjectId(session.userId),
      });

    if (!user) {
      return NextResponse.json(
        {
          message: "Usuário não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    if (user.active === false) {
      return NextResponse.json(
        {
          message: "Usuário bloqueado",
        },
        {
          status: 403,
        }
      );
    }

    if (!user.businessId) {
      return NextResponse.json(
        {
          message:
            "Usuário não possui empresa vinculada",
        },
        {
          status: 400,
        }
      );
    }

    const businessIdString =
      String(user.businessId);

    if (
      !ObjectId.isValid(
        businessIdString
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Empresa inválida",
        },
        {
          status: 400,
        }
      );
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
      return NextResponse.json(
        {
          message:
            "Empresa não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (business.active === false) {
      return NextResponse.json(
        {
          message:
            "Empresa bloqueada",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Compatibilidade:
      profissionais antigos podem estar
      vinculados por businessSlug.

      Os novos devem usar businessId.
    */

    const filters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      filters.push({
        businessSlug:
          business.slug,
      });
    }

    const professionals = await db
      .collection("professionals")
      .find({
        $or: filters,
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
              "Profissional",

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
      "Erro em GET /api/dashboard/professionals:",
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