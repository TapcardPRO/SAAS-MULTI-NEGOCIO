import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const auth =
      await requireBusinessSession();

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

    const filters: any[] = [
      {
        businessId:
          auth.businessId,
      },
      {
        businessId:
          auth.businessId.toString(),
      },
    ];

    if (auth.business.slug) {
      filters.push({
        businessSlug:
          auth.business.slug,
      });
    }

    const query: any = {
      $or: filters,

      active: {
        $ne: false,
      },
    };

    if (
      auth.user.role ===
      "employee"
    ) {
      const professionalId =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          professionalId
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Profissional não vinculado ao usuário",
          },
          {
            status: 403,
          }
        );
      }

      query._id =
        new ObjectId(
          professionalId
        );
    }

    const professionals =
      await auth.db
        .collection(
          "professionals"
        )
        .find(query)
        .sort({
          order: 1,
          name: 1,
        })
        .project({
          name: 1,
          active: 1,
        })
        .toArray();

    return NextResponse.json({
      ok: true,

      professionals:
        professionals.map(
          (professional) => ({
            _id:
              professional._id.toString(),

            name:
              String(
                professional.name ||
                  "Profissional"
              ),

            active:
              professional.active !==
              false,
          })
        ),
    });
  } catch (error) {
    console.error(
      "BOOKING PROFESSIONALS ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar profissionais",
      },
      {
        status: 500,
      }
    );
  }
}
