import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAuthenticatedBusiness() {
  const cookieStore = await cookies();

  const token = cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const session = await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(session.userId)
  ) {
    return {
      error: NextResponse.json(
        {
          message: "Sessão inválida",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const db = await getDb();

  const user = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(session.userId),
    });

  if (!user) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário não encontrado",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (user.active === false) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário bloqueado",
        },
        {
          status: 403,
        }
      ),
    };
  }

  if (!user.businessId) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário sem empresa vinculada",
        },
        {
          status: 400,
        }
      ),
    };
  }

  const businessIdString = String(user.businessId);

  if (!ObjectId.isValid(businessIdString)) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa inválida",
        },
        {
          status: 400,
        }
      ),
    };
  }

  const businessId = new ObjectId(businessIdString);

  const business = await db
    .collection("businesses")
    .findOne({
      _id: businessId,
    });

  if (!business) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa não encontrada",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (business.active === false) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa bloqueada",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    db,
    business,
    businessId,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if ("error" in auth) {
      return auth.error;
    }

    const {
      db,
      businessId,
      business,
    } = auth;

    const url = new URL(request.url);

    const daysParam =
      Number(
        url.searchParams.get("days") || 30
      );

    const days =
      Number.isFinite(daysParam) &&
      daysParam > 0
        ? Math.min(daysParam, 3650)
        : 30;

    const today =
      getTodaySaoPaulo();

    const startDate =
      subtractDays(
        today,
        days - 1
      );

    const query = {
      date: {
        $gte: startDate,
        $lte: today,
      },

      $or: [
        {
          businessId,
        },
        {
          businessId:
            businessId.toString(),
        },
        ...(business.slug
          ? [
              {
                businessSlug:
                  business.slug,
              },
            ]
          : []),
      ],
    };

    const appointments = await db
      .collection("appointments")
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
        endDate: today,
      },

      appointments:
        appointments.map(
          (appointment) => ({
            _id:
              appointment._id.toString(),

            clientName:
              appointment.clientName ||
              appointment.customerName ||
              "Cliente",

            serviceName:
              appointment.serviceName ||
              appointment.serviceSnapshot?.name ||
              "Serviço",

            professionalName:
              appointment.professionalName ||
              appointment.professionalSnapshot?.name ||
              "Profissional",

            date:
              appointment.date || "",

            time:
              appointment.time ||
              appointment.startTime ||
              "",

            price:
              Number(
                appointment.price ??
                  appointment.servicePrice ??
                  appointment.serviceSnapshot?.price ??
                  0
              ),

            status:
              normalizeStatus(
                appointment.status
              ),
          })
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
    status === "completed" ||
    status === "concluído"
  ) {
    return "concluido";
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return "cancelado";
  }

  if (
    status === "no_show" ||
    status === "no-show"
  ) {
    return "faltou";
  }

  if (
    status === "confirmed"
  ) {
    return "confirmado";
  }

  if (
    status === "pending"
  ) {
    return "pendente";
  }

  return status || "pendente";
}

function getTodaySaoPaulo() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day"
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
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}