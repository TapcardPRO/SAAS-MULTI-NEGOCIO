import {
  NextResponse,
} from "next/server";

import {
  requireBusinessSession,
} from "@/lib/tenant-auth";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const auth =
      await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      business: {
        name:
          String(
            auth.business.name ||
              "Empresa"
          ),

        logoUrl:
          String(
            auth.business.logoUrl ||
              ""
          ),

        phone:
          String(
            auth.business.phone ||
              auth.business.whatsapp ||
              ""
          ),

        address:
          String(
            auth.business.address ||
              ""
          ),
      },
    });
  } catch (error) {
    console.error(
      "RECEIPT CONTEXT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar dados do recibo.",
      },
      {
        status: 500,
      }
    );
  }
}
