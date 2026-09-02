import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getDb,
} from "@/lib/db";

import {
  getPublicBookingAvailability,
} from "@/lib/public-booking-availability";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Props
) {
  try {
    const {
      slug,
    } =
      await params;

    const url =
      new URL(
        request.url
      );

    const rawServiceIds =
      String(
        url.searchParams.get(
          "serviceIds"
        ) ||
        url.searchParams.get(
          "serviceId"
        ) ||
        ""
      );

    const serviceIds =
      rawServiceIds
        .split(",")
        .map(
          (value) =>
            value.trim()
        )
        .filter(
          Boolean
        );

    const professionalId =
      String(
        url.searchParams.get(
          "professionalId"
        ) ||
          ""
      ).trim();

    const date =
      String(
        url.searchParams.get(
          "date"
        ) ||
          ""
      ).trim();

    const db =
      await getDb();

    const result =
      await getPublicBookingAvailability(
        db,
        {
          slug,
          serviceIds,
          professionalId,
          date,
        }
      );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok:
            false,

          message:
            result.message ||
            "Não foi possível calcular a disponibilidade.",
        },
        {
          status:
            result.status,
        }
      );
    }

    return NextResponse.json({
      ok:
        true,

      serviceIds,

      services:
        (
          result.services ||
          []
        ).map(
          (service) => ({
            id:
              String(
                service._id
              ),

            name:
              String(
                service.name ||
                  ""
              ),

            duration:
              Number(
                service.duration ||
                  30
              ),

            price:
              Number(
                service.price ||
                  0
              ),
          })
        ),

      totalDuration:
        result.totalDuration ||
        0,

      totalPrice:
        result.totalPrice ||
        0,

      professional:
        result.professional
          ? {
              id:
                String(
                  result.professional._id
                ),

              name:
                String(
                  result.professional.name ||
                    ""
                ),
            }
          : null,

      date,

      slots:
        result.slots ||
        [],

      message:
        result.message ||
        "",
    });
  } catch (error) {
    console.error(
      "PUBLIC AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok:
          false,

        message:
          "Erro ao calcular disponibilidade.",
      },
      {
        status:
          500,
      }
    );
  }
}
