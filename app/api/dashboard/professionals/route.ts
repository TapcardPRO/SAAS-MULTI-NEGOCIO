import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireOwnerSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const filters: any[] = [
      {
        businessId: auth.businessId,
      },
      {
        businessId: auth.businessId.toString(),
      },
    ];

    if (auth.business.slug) {
      filters.push({
        businessSlug: auth.business.slug,
      });
    }

    const professionals = await auth.db
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
      professionals: professionals.map(
        (professional) => ({
          _id: professional._id.toString(),

          name:
            professional.name ||
            "Profissional",

          role:
            professional.role || "",

          description:
            professional.description || "",

          photoUrl:
            professional.photoUrl || "",

          phone:
            professional.phone || "",

          email:
            professional.email || "",

          commission:
            Number(
              professional.commission || 0
            ),

          allowPanelAccess:
            professional.allowPanelAccess ===
            true,

          accessEmail:
            professional.accessEmail ||
            professional.email ||
            "",

          hasPanelUser:
            Boolean(
              professional.panelUserId
            ),

          active:
            professional.active !== false,

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
