import {
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  ObjectId,
} from "mongodb";

import {
  getDb,
} from "@/lib/db";

import {
  verifySessionToken,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export async function GET() {
  try {
    const auth =
      await requireSuperAdmin();

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

    const db =
      auth.db;

    const today =
      todaySaoPaulo();

    const start30 =
      subtractDays(
        today,
        29
      );

    const [
      businesses,
      saasPlans,
      appointments,
      customerCount,
      activeMemberships,
      owners,
      employees,
    ] =
      await Promise.all([
        db
          .collection(
            "businesses"
          )
          .find({})
          .sort({
            createdAt: -1,
          })
          .toArray(),

        db
          .collection(
            "saas_plans"
          )
          .find({})
          .toArray(),

        db
          .collection(
            "appointments"
          )
          .find({
            date: {
              $gte:
                start30,

              $lte:
                today,
            },
          })
          .toArray(),

        db
          .collection(
            "customer_accounts"
          )
          .countDocuments({
            active: {
              $ne: false,
            },
          }),

        db
          .collection(
            "memberships"
          )
          .countDocuments({
            active: {
              $ne: false,
            },
          }),

        db
          .collection(
            "users"
          )
          .countDocuments({
            role:
              "owner",

            active: {
              $ne: false,
            },
          }),

        db
          .collection(
            "users"
          )
          .countDocuments({
            role:
              "employee",

            active: {
              $ne: false,
            },
          }),
      ]);

    const planMap =
      new Map<
        string,
        any
      >();

    for (
      const plan of
      saasPlans
    ) {
      planMap.set(
        String(
          plan.slug ||
            ""
        ),
        plan
      );
    }

    let activeBusinesses =
      0;

    let inactiveBusinesses =
      0;

    let trialBusinesses =
      0;

    let pastDueBusinesses =
      0;

    let cancelledBusinesses =
      0;

    let mrr =
      0;

    for (
      const business of
      businesses
    ) {
      if (
        business.active ===
        false
      ) {
        inactiveBusinesses +=
          1;
      } else {
        activeBusinesses +=
          1;
      }

      const billingStatus =
        normalizeBillingStatus(
          business
            .billingStatus
        );

      if (
        billingStatus ===
        "trial"
      ) {
        trialBusinesses +=
          1;
      }

      if (
        billingStatus ===
        "past_due"
      ) {
        pastDueBusinesses +=
          1;
      }

      if (
        billingStatus ===
        "cancelled"
      ) {
        cancelledBusinesses +=
          1;
      }

      if (
        business.active !==
          false &&
        billingStatus !==
          "cancelled" &&
        billingStatus !==
          "past_due"
      ) {
        const plan =
          planMap.get(
            String(
              business.plan ||
                ""
            )
          );

        const price =
          Number(
            plan?.price ||
              0
          );

        if (
          Number.isFinite(
            price
          )
        ) {
          if (
            String(
              plan?.billingCycle ||
                "monthly"
            ) ===
            "yearly"
          ) {
            mrr +=
              price /
              12;
          } else {
            mrr +=
              price;
          }
        }
      }
    }

    const completed =
      appointments.filter(
        (appointment) =>
          normalizeStatus(
            appointment.status
          ) ===
          "concluido"
      );

    const revenue30 =
      completed.reduce(
        (
          total: number,
          appointment: any
        ) =>
          total +
          safeNumber(
            appointment.price ??
              appointment.servicePrice
          ),
        0
      );

    const recentBusinesses =
      businesses
        .slice(
          0,
          8
        )
        .map(
          (business) => ({
            id:
              String(
                business._id
              ),

            name:
              String(
                business.name ||
                  ""
              ),

            slug:
              String(
                business.slug ||
                  ""
              ),

            plan:
              String(
                business.plan ||
                  "basico"
              ),

            active:
              business.active !==
              false,

            billingStatus:
              normalizeBillingStatus(
                business.billingStatus
              ),

            trialEndsAt:
              formatStoredDate(
                business.trialEndsAt
              ),

            createdAt:
              business.createdAt ||
              null,
          })
        );

    return NextResponse.json({
      ok: true,

      summary: {
        businesses:
          businesses.length,

        activeBusinesses,

        inactiveBusinesses,

        trialBusinesses,

        pastDueBusinesses,

        cancelledBusinesses,

        customers:
          customerCount,

        memberships:
          activeMemberships,

        owners,

        employees,

        appointments30:
          appointments.length,

        completed30:
          completed.length,

        revenue30,

        mrr,
      },

      recentBusinesses,
    });
  } catch (error) {
    console.error(
      "ADMIN OVERVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          "Erro ao carregar visão administrativa.",
      },
      {
        status: 500,
      }
    );
  }
}

async function requireSuperAdmin() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "saas_session"
    )?.value;

  if (!token) {
    return {
      ok:
        false as const,

      status:
        401,

      message:
        "Usuário não autenticado",
    };
  }

  const session =
    await verifySessionToken(
      token
    );

  const userId =
    String(
      session?.userId ||
        ""
    );

  if (
    !ObjectId.isValid(
      userId
    )
  ) {
    return {
      ok:
        false as const,

      status:
        401,

      message:
        "Sessão inválida",
    };
  }

  const db =
    await getDb();

  const admin =
    await db
      .collection(
        "users"
      )
      .findOne({
        _id:
          new ObjectId(
            userId
          ),
      });

  if (
    !admin ||
    admin.active ===
      false
  ) {
    return {
      ok:
        false as const,

      status:
        401,

      message:
        "Administrador inválido",
    };
  }

  if (
    admin.role !==
    "superadmin"
  ) {
    return {
      ok:
        false as const,

      status:
        403,

      message:
        "Acesso exclusivo do Super Admin",
    };
  }

  return {
    ok:
      true as const,

    db,

    admin,
  };
}

function normalizeBillingStatus(
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
    [
      "trial",
      "active",
      "past_due",
      "cancelled",
    ].includes(
      status
    )
  ) {
    return status;
  }

  return "active";
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

  return status;
}

function safeNumber(
  value: unknown
) {
  const number =
    Number(
      value ||
        0
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

function formatStoredDate(
  value: unknown
) {
  if (!value) {
    return "";
  }

  if (
    typeof value ===
    "string"
  ) {
    return value.slice(
      0,
      10
    );
  }

  if (
    value instanceof Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10
      );
  }

  return "";
}

function todaySaoPaulo() {
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
