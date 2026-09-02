import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireOwnerSession();

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

    const endDate =
      getTodaySaoPaulo();

    const startDate =
      subtractDays(
        endDate,
        days - 1
      );

    const tenantFilters =
      businessFilters(
        auth.businessId,
        auth.business.slug
      );

    const appointments =
      await auth.db
        .collection(
          "appointments"
        )
        .find({
          $or:
            tenantFilters,

          date: {
            $gte:
              startDate,

            $lte:
              endDate,
          },
        })
        .toArray();

    const expenses =
      await auth.db
        .collection(
          "expenses"
        )
        .find({
          $or:
            tenantFilters,

          date: {
            $gte:
              startDate,

            $lte:
              endDate,
          },
        })
        .toArray();

    const completed =
      appointments.filter(
        (
          appointment
        ) =>
          normalizeStatus(
            appointment.status
          ) ===
          "concluido"
      );

    const cancelled =
      appointments.filter(
        (
          appointment
        ) =>
          normalizeStatus(
            appointment.status
          ) ===
          "cancelado"
      );

    const noShow =
      appointments.filter(
        (
          appointment
        ) =>
          normalizeStatus(
            appointment.status
          ) ===
          "faltou"
      );

    const revenue =
      completed.reduce(
        (
          total,
          item
        ) =>
          total +
          getPrice(
            item
          ),
        0
      );

    const paidExpenses =
      expenses
        .filter(
          (item) =>
            item.status ===
            "paid"
        )
        .reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount ||
                0
            ),
          0
        );

    const pendingExpenses =
      expenses
        .filter(
          (item) =>
            item.status ===
            "pending"
        )
        .reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.amount ||
                0
            ),
          0
        );

    const serviceMap =
      new Map<
        string,
        {
          name:
            string;

          quantity:
            number;

          revenue:
            number;
        }
      >();

    const professionalMap =
      new Map<
        string,
        {
          name:
            string;

          quantity:
            number;

          revenue:
            number;
        }
      >();

    const dailyMap =
      new Map<
        string,
        {
          date:
            string;

          revenue:
            number;

          expenses:
            number;
        }
      >();

    for (
      const appointment of
      completed
    ) {
      const price =
        getPrice(
          appointment
        );

      const serviceName =
        String(
          appointment.serviceName ||
            appointment
              .serviceSnapshot
              ?.name ||
            "Serviço"
        );

      const professionalName =
        String(
          appointment.professionalName ||
            appointment
              .professionalSnapshot
              ?.name ||
            "Profissional"
        );

      const service =
        serviceMap.get(
          serviceName
        ) || {
          name:
            serviceName,

          quantity:
            0,

          revenue:
            0,
        };

      service.quantity +=
        1;

      service.revenue +=
        price;

      serviceMap.set(
        serviceName,
        service
      );

      const professional =
        professionalMap.get(
          professionalName
        ) || {
          name:
            professionalName,

          quantity:
            0,

          revenue:
            0,
        };

      professional.quantity +=
        1;

      professional.revenue +=
        price;

      professionalMap.set(
        professionalName,
        professional
      );

      const date =
        String(
          appointment.date ||
            ""
        );

      if (date) {
        const daily =
          dailyMap.get(
            date
          ) || {
            date,
            revenue:
              0,
            expenses:
              0,
          };

        daily.revenue +=
          price;

        dailyMap.set(
          date,
          daily
        );
      }
    }

    for (
      const expense of
      expenses
    ) {
      if (
        expense.status !==
        "paid"
      ) {
        continue;
      }

      const date =
        String(
          expense.date ||
            ""
        );

      if (!date) {
        continue;
      }

      const daily =
        dailyMap.get(
          date
        ) || {
          date,
          revenue:
            0,
          expenses:
            0,
        };

      daily.expenses +=
        Number(
          expense.amount ||
            0
        );

      dailyMap.set(
        date,
        daily
      );
    }

    return NextResponse.json({
      ok: true,

      period: {
        days,
        startDate,
        endDate,
      },

      summary: {
        revenue,

        paidExpenses,

        pendingExpenses,

        profit:
          revenue -
          paidExpenses,

        completed:
          completed.length,

        cancelled:
          cancelled.length,

        noShow:
          noShow.length,

        ticket:
          completed.length >
          0
            ? revenue /
              completed.length
            : 0,
      },

      services:
        Array.from(
          serviceMap.values()
        ).sort(
          (
            a,
            b
          ) =>
            b.revenue -
            a.revenue
        ),

      professionals:
        Array.from(
          professionalMap.values()
        ).sort(
          (
            a,
            b
          ) =>
            b.revenue -
            a.revenue
        ),

      daily:
        Array.from(
          dailyMap.values()
        )
          .map(
            (item) => ({
              ...item,

              profit:
                item.revenue -
                item.expenses,
            })
          )
          .sort(
            (
              a,
              b
            ) =>
              b.date.localeCompare(
                a.date
              )
          ),
    });
  } catch (error) {
    console.error(
      "REPORTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao gerar relatório.",
      },
      {
        status: 500,
      }
    );
  }
}

function getPrice(
  appointment: any
) {
  return Number(
    appointment.price ??
      appointment.servicePrice ??
      appointment
        .serviceSnapshot
        ?.price ??
      0
  );
}

function normalizeStatus(
  value: unknown
) {
  const status =
    String(
      value ||
        ""
    )
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

  return status;
}

function businessFilters(
  businessId: any,
  slug?: string
) {
  return [
    {
      businessId,
    },

    {
      businessId:
        String(
          businessId
        ),
    },

    ...(slug
      ? [
          {
            businessSlug:
              slug,
          },
        ]
      : []),
  ];
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
