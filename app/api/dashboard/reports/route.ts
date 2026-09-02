import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

import {
  ensureVelltoIndexes,
} from "@/lib/vellto-indexes";

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

    void ensureVelltoIndexes(
      auth.db
    );

    const url =
      new URL(
        request.url
      );

    const daysParam =
      Number(
        url.searchParams.get(
          "days"
        ) ||
          30
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

    const [
      appointments,
      expenses,
      professionals,
    ] =
      await Promise.all([
        auth.db
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
          .toArray(),

        auth.db
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
          .toArray(),

        auth.db
          .collection(
            "professionals"
          )
          .find({
            $or:
              tenantFilters,
          })
          .toArray(),
      ]);

    const commissionMap =
      new Map<
        string,
        number
      >();

    for (
      const professional of
      professionals
    ) {
      commissionMap.set(
        String(
          professional._id
        ),
        normalizePercent(
          professional.commission
        )
      );
    }

    const completed =
      appointments.filter(
        (appointment) =>
          normalizeStatus(
            appointment.status
          ) ===
          "concluido"
      );

    const cancelled =
      appointments.filter(
        (appointment) =>
          normalizeStatus(
            appointment.status
          ) ===
          "cancelado"
      );

    const noShow =
      appointments.filter(
        (appointment) =>
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

    type RankingItem = {
      name: string;
      quantity: number;
      revenue: number;
    };

    type ProfessionalRanking = {
      id: string;
      name: string;
      quantity: number;
      revenue: number;
      commissionPercent: number;
      commission: number;
      netRevenue: number;
    };

    const serviceMap =
      new Map<
        string,
        RankingItem
      >();

    const professionalMap =
      new Map<
        string,
        ProfessionalRanking
      >();

    const dailyMap =
      new Map<
        string,
        {
          date: string;
          revenue: number;
          expenses: number;
          commissions: number;
        }
      >();

    let totalCommissions =
      0;

    let membershipExtraRevenue =
      0;

    for (
      const appointment of
      completed
    ) {
      const appointmentPrice =
        getPrice(
          appointment
        );

      membershipExtraRevenue +=
        Number(
          appointment.membershipExtraAmount ||
            0
        );

      /*
      ===================================================
      SERVIÇOS INDIVIDUAIS
      ===================================================

      Se houver snapshot multi-serviço,
      cada serviço é contado separadamente.

      O faturamento é distribuído proporcionalmente
      ao preço original de cada serviço.

      Isso evita:
      Corte + Barba virar uma terceira categoria.
      */

      const services =
        getAppointmentServices(
          appointment
        );

      if (
        services.length > 0
      ) {
        const snapshotTotal =
          services.reduce(
            (total: number, service: any) =>
              total +
              Math.max(
                0,
                Number(
                  service.price ||
                    0
                )
              ),
            0
          );

        for (
          const service of
          services
        ) {
          const name =
            String(
              service.name ||
                "Serviço"
            );

          const servicePrice =
            Number(
              service.price ||
                0
            );

          const allocatedRevenue =
            snapshotTotal > 0
              ? appointmentPrice *
                (
                  servicePrice /
                  snapshotTotal
                )
              : appointmentPrice /
                services.length;

          const item =
            serviceMap.get(
              name
            ) || {
              name,
              quantity: 0,
              revenue: 0,
            };

          item.quantity +=
            1;

          item.revenue +=
            allocatedRevenue;

          serviceMap.set(
            name,
            item
          );
        }
      } else {
        const name =
          String(
            appointment.serviceName ||
              appointment
                .serviceSnapshot
                ?.name ||
              "Serviço"
          );

        const item =
          serviceMap.get(
            name
          ) || {
            name,
            quantity: 0,
            revenue: 0,
          };

        item.quantity +=
          1;

        item.revenue +=
          appointmentPrice;

        serviceMap.set(
          name,
          item
        );
      }

      /*
      ===================================================
      PROFISSIONAL / COMISSÃO
      ===================================================
      */

      const professionalId =
        String(
          appointment.professionalId ||
            ""
        );

      const professionalName =
        String(
          appointment.professionalName ||
            appointment
              .professionalSnapshot
              ?.name ||
            "Profissional"
        );

      const commissionPercent =
        commissionMap.get(
          professionalId
        ) ||
        0;

      const commission =
        appointmentPrice *
        commissionPercent /
        100;

      totalCommissions +=
        commission;

      const professional =
        professionalMap.get(
          professionalId ||
            professionalName
        ) || {
          id:
            professionalId,

          name:
            professionalName,

          quantity:
            0,

          revenue:
            0,

          commissionPercent,

          commission:
            0,

          netRevenue:
            0,
        };

      professional.quantity +=
        1;

      professional.revenue +=
        appointmentPrice;

      professional.commission +=
        commission;

      professional.netRevenue =
        professional.revenue -
        professional.commission;

      professionalMap.set(
        professionalId ||
          professionalName,
        professional
      );

      /*
      ===================================================
      DIÁRIO
      ===================================================
      */

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
            revenue: 0,
            expenses: 0,
            commissions: 0,
          };

        daily.revenue +=
          appointmentPrice;

        daily.commissions +=
          commission;

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
          revenue: 0,
          expenses: 0,
          commissions: 0,
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

        commissions:
          totalCommissions,

        operatingProfit:
          revenue -
          paidExpenses,

        profit:
          revenue -
          paidExpenses -
          totalCommissions,

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

        membershipExtraRevenue,
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

              operatingProfit:
                item.revenue -
                item.expenses,

              profit:
                item.revenue -
                item.expenses -
                item.commissions,
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

function getAppointmentServices(
  appointment: any
) {
  if (
    Array.isArray(
      appointment.services
    ) &&
    appointment.services.length >
      0
  ) {
    return appointment.services.map(
      (
        service: any
      ) => ({
        name:
          String(
            service.name ||
              "Serviço"
          ),

        price:
          Number(
            service.price ||
              0
          ),

        duration:
          Number(
            service.duration ||
              0
          ),
      })
    );
  }

  return [];
}

function normalizePercent(
  value: unknown
) {
  const number =
    Number(
      value ||
        0
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      number
    )
  );
}

function getPrice(
  appointment: any
) {
  const value =
    Number(
      appointment.price ??
        appointment.servicePrice ??
        appointment
          .serviceSnapshot
          ?.price ??
        0
    );

  return Number.isFinite(
    value
  )
    ? value
    : 0;
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
  ] =
    value
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
