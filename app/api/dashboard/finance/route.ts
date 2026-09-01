import {
  NextRequest,
  NextResponse,
} from "next/server";

import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const daysParam =
      Number(
        url.searchParams.get(
          "days"
        ) || 30
      );

    const days =
      Number.isFinite(
        daysParam
      ) &&
      daysParam > 0
        ? Math.min(
            daysParam,
            3650
          )
        : 30;

    const today =
      getTodaySaoPaulo();

    const startDate =
      subtractDays(
        today,
        days - 1
      );

    const query: any = {
      date: {
        $gte:
          startDate,
        $lte:
          today,
      },

      $or: [
        {
          businessId:
            auth.businessId,
        },
        {
          businessId:
            auth.businessId.toString(),
        },
        ...(auth.business.slug
          ? [
              {
                businessSlug:
                  auth.business.slug,
              },
            ]
          : []),
      ],
    };

    let commissionPercent =
      0;

    let professionalName =
      "";

    if (
      auth.user.role ===
      "employee"
    ) {
      const professionalId =
        String(
          auth.user
            .professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          professionalId
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Profissional não vinculado ao usuário",
          },
          {
            status: 403,
          }
        );
      }

      query.professionalId =
        {
          $in: [
            professionalId,
            new ObjectId(
              professionalId
            ),
          ],
        };

      const professional =
        await auth.db
          .collection(
            "professionals"
          )
          .findOne({
            _id:
              new ObjectId(
                professionalId
              ),
          });

      commissionPercent =
        Number(
          professional
            ?.commission ||
            0
        );

      professionalName =
        String(
          professional
            ?.name ||
            auth.user.name ||
            ""
        );
    }

    const appointments =
      await auth.db
        .collection(
          "appointments"
        )
        .find(query)
        .sort({
          date: -1,
          time: -1,
          startTime: -1,
        })
        .toArray();

    return NextResponse.json({
      period: {
        days,
        startDate,
        endDate:
          today,
      },

      viewer: {
        role:
          auth.user.role ||
          "owner",

        professionalId:
          auth.user
            .professionalId
            ? String(
                auth.user
                  .professionalId
              )
            : null,

        professionalName,

        commissionPercent,
      },

      appointments:
        appointments.map(
          (
            appointment
          ) => {
            const price =
              Number(
                appointment.price ??
                  appointment.servicePrice ??
                  appointment
                    .serviceSnapshot
                    ?.price ??
                  0
              );

            const commissionValue =
              auth.user.role ===
              "employee"
                ? price *
                  (commissionPercent /
                    100)
                : 0;

            return {
              _id:
                appointment._id.toString(),

              clientName:
                appointment.clientName ||
                appointment.customerName ||
                "Cliente",

              serviceName:
                appointment.serviceName ||
                appointment
                  .serviceSnapshot
                  ?.name ||
                "Serviço",

              professionalName:
                appointment.professionalName ||
                appointment
                  .professionalSnapshot
                  ?.name ||
                "Profissional",

              date:
                appointment.date ||
                "",

              time:
                appointment.time ||
                appointment.startTime ||
                "",

              price,

              commissionPercent,

              commissionValue,

              status:
                normalizeStatus(
                  appointment.status
                ),
            };
          }
        ),
    });
  } catch (error) {
    console.error(
      "Erro em GET /api/dashboard/finance:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar financeiro",
      },
      {
        status: 500,
      }
    );
  }
}

function normalizeStatus(
  value: unknown
) {
  const status =
    String(value || "")
      .trim()
      .toLowerCase();

  if (
    status ===
      "completed" ||
    status ===
      "concluído"
  ) {
    return "concluido";
  }

  if (
    status ===
      "cancelled" ||
    status ===
      "canceled"
  ) {
    return "cancelado";
  }

  if (
    status ===
      "no_show" ||
    status ===
      "no-show"
  ) {
    return "faltou";
  }

  if (
    status ===
    "confirmed"
  ) {
    return "confirmado";
  }

  if (
    status ===
    "pending"
  ) {
    return "pendente";
  }

  return (
    status ||
    "pendente"
  );
}

function getTodaySaoPaulo() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function subtractDays(
  value: string,
  amount: number
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  date.setUTCDate(
    date.getUTCDate() -
      amount
  );

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() +
      1
  ).padStart(
    2,
    "0"
  )}-${String(
    date.getUTCDate()
  ).padStart(
    2,
    "0"
  )}`;
}
