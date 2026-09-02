import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

import {
  makeBusinessFilters,
} from "@/lib/monthly-closing";

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

    const month =
      String(
        url.searchParams.get(
          "month"
        ) || ""
      ).trim();

    if (
      !/^\d{4}-\d{2}$/.test(
        month
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Mês inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const filters =
      makeBusinessFilters(
        auth.businessId,
        auth.business.slug
      );

    const closing =
      await auth.db
        .collection(
          "monthly_closings"
        )
        .findOne({
          month,

          status:
            "closed",

          $or:
            filters,
        });

    const preview =
      await calculateMonth(
        auth.db,
        filters,
        month
      );

    return NextResponse.json({
      ok: true,

      month,

      closed:
        Boolean(
          closing
        ),

      closing:
        closing
          ? serializeClosing(
              closing
            )
          : null,

      preview,
    });
  } catch (error) {
    console.error(
      "GET MONTHLY CLOSING ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar fechamento mensal.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
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

    const body =
      await request.json();

    const month =
      String(
        body.month || ""
      ).trim();

    if (
      !/^\d{4}-\d{2}$/.test(
        month
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Mês inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const filters =
      makeBusinessFilters(
        auth.businessId,
        auth.business.slug
      );

    const existing =
      await auth.db
        .collection(
          "monthly_closings"
        )
        .findOne({
          month,

          status:
            "closed",

          $or:
            filters,
        });

    if (
      existing
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este mês já está fechado.",
        },
        {
          status: 409,
        }
      );
    }

    const snapshot =
      await calculateMonth(
        auth.db,
        filters,
        month
      );

    const now =
      new Date();

    const closing = {
      businessId:
        auth.businessId,

      businessSlug:
        auth.business.slug ||
        "",

      month,

      status:
        "closed",

      snapshot,

      closedAt:
        now,

      closedBy: {
        userId:
          auth.user._id
            ? String(
                auth.user._id
              )
            : "",

        name:
          String(
            auth.user.name ||
              ""
          ),

        email:
          String(
            auth.user.email ||
              ""
          ),
      },

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await auth.db
        .collection(
          "monthly_closings"
        )
        .insertOne(
          closing
        );

    return NextResponse.json(
      {
        ok: true,

        message:
          "Mês fechado com sucesso.",

        closing: {
          ...closing,

          _id:
            result.insertedId.toString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST MONTHLY CLOSING ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao fechar mês.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
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

    const body =
      await request.json();

    const month =
      String(
        body.month || ""
      ).trim();

    if (
      !/^\d{4}-\d{2}$/.test(
        month
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Mês inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const filters =
      makeBusinessFilters(
        auth.businessId,
        auth.business.slug
      );

    const result =
      await auth.db
        .collection(
          "monthly_closings"
        )
        .updateOne(
          {
            month,

            status:
              "closed",

            $or:
              filters,
          },
          {
            $set: {
              status:
                "reopened",

              reopenedAt:
                new Date(),

              reopenedBy: {
                userId:
                  auth.user._id
                    ? String(
                        auth.user._id
                      )
                    : "",

                name:
                  String(
                    auth.user.name ||
                      ""
                  ),

                email:
                  String(
                    auth.user.email ||
                      ""
                  ),
              },

              updatedAt:
                new Date(),
            },
          }
        );

    if (
      result.modifiedCount !==
      1
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Nenhum fechamento ativo encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      message:
        "Mês reaberto com sucesso.",
    });
  } catch (error) {
    console.error(
      "DELETE MONTHLY CLOSING ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao reabrir mês.",
      },
      {
        status: 500,
      }
    );
  }
}

async function calculateMonth(
  db: any,
  filters: any[],
  month: string
) {
  const startDate =
    `${month}-01`;

  const endDate =
    `${month}-31`;

  const appointments =
    await db
      .collection(
        "appointments"
      )
      .find({
        $or:
          filters,

        date: {
          $gte:
            startDate,

          $lte:
            endDate,
        },
      })
      .toArray();

  const expenses =
    await db
      .collection(
        "expenses"
      )
      .find({
        $or:
          filters,

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
      (item: any) =>
        normalizeStatus(
          item.status
        ) ===
        "concluido"
    );

  const cancelled =
    appointments.filter(
      (item: any) =>
        normalizeStatus(
          item.status
        ) ===
        "cancelado"
    );

  const noShow =
    appointments.filter(
      (item: any) =>
        normalizeStatus(
          item.status
        ) ===
        "faltou"
    );

  const revenue =
    completed.reduce(
      (
        total: number,
        item: any
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
        (item: any) =>
          item.status ===
          "paid"
      )
      .reduce(
        (
          total: number,
          item: any
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
        (item: any) =>
          item.status ===
          "pending"
      )
      .reduce(
        (
          total: number,
          item: any
        ) =>
          total +
          Number(
            item.amount ||
              0
          ),
        0
      );

  const services =
    new Map<
      string,
      {
        name: string;
        quantity: number;
        revenue: number;
      }
    >();

  const professionals =
    new Map<
      string,
      {
        name: string;
        quantity: number;
        revenue: number;
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
      services.get(
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

    services.set(
      serviceName,
      service
    );

    const professional =
      professionals.get(
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

    professionals.set(
      professionalName,
      professional
    );
  }

  return {
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

    expenseCount:
      expenses.length,

    serviceRanking:
      Array.from(
        services.values()
      ).sort(
        (
          a,
          b
        ) =>
          b.revenue -
          a.revenue
      ),

    professionalRanking:
      Array.from(
        professionals.values()
      ).sort(
        (
          a,
          b
        ) =>
          b.revenue -
          a.revenue
      ),
  };
}

function normalizeStatus(
  value: unknown
) {
  const status =
    String(
      value || ""
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

function serializeClosing(
  closing: any
) {
  return {
    _id:
      String(
        closing._id
      ),

    month:
      String(
        closing.month ||
          ""
      ),

    status:
      String(
        closing.status ||
          ""
      ),

    snapshot:
      closing.snapshot ||
      {},

    closedAt:
      closing.closedAt ||
      null,

    closedBy:
      closing.closedBy ||
      null,
  };
}
