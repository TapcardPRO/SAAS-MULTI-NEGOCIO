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

    const businessVariants: Array<
      string | ObjectId
    > = [
      auth.businessId,
      auth.businessId.toString(),
    ];

    const clients = await auth.db
      .collection("clients")
      .find({
        businessId: {
          $in: businessVariants,
        },
        active: {
          $ne: false,
        },
      })
      .sort({
        name: 1,
      })
      .project({
        name: 1,
        phone: 1,
      })
      .toArray();

    return NextResponse.json({
      ok: true,

      clients: clients.map(
        (client) => ({
          _id:
            client._id.toString(),

          name:
            String(
              client.name || ""
            ),

          phone:
            String(
              client.phone || ""
            ),
        })
      ),
    });
  } catch (error) {
    console.error(
      "BOOKING CLIENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar clientes",
      },
      {
        status: 500,
      }
    );
  }
}
