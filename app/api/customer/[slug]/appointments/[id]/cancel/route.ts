import {
  NextRequest,
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
  verifyCustomerSessionToken,
} from "@/lib/auth";

import {
  normalizePhone,
} from "@/lib/booking";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

export async function POST(
  _request: NextRequest,
  { params }: Props
) {
  try {
    const {
      slug,
      id,
    } =
      await params;

    if (
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Agendamento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "saas_customer_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cliente não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifyCustomerSessionToken(
        token
      );

    const customerId =
      String(
        session?.customerId ||
          ""
      );

    if (
      !ObjectId.isValid(
        customerId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Sessão inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const db =
      await getDb();

    const customer =
      await db
        .collection(
          "customer_accounts"
        )
        .findOne({
          _id:
            new ObjectId(
              customerId
            ),

          active: {
            $ne: false,
          },
        });

    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Conta do cliente não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const business =
      await db
        .collection(
          "businesses"
        )
        .findOne({
          slug,

          active: {
            $ne: false,
          },
        });

    if (!business) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Empresa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const businessId =
      business._id;

    const identity:
      any[] = [];

    const phone =
      String(
        customer.phone ||
          ""
      ).trim();

    const phoneNormalized =
      String(
        customer.phoneNormalized ||
          normalizePhone(
            phone
          ) ||
          ""
      );

    const email =
      String(
        customer.email ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      phoneNormalized
    ) {
      identity.push(
        {
          phoneNormalized,
        },
        {
          phoneNorm:
            phoneNormalized,
        }
      );
    }

    if (phone) {
      identity.push({
        phone,
      });
    }

    if (email) {
      identity.push({
        email,
      });
    }

    if (
      identity.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Não foi possível identificar o cliente.",
        },
        {
          status: 409,
        }
      );
    }

    const client =
      await db
        .collection(
          "clients"
        )
        .findOne({
          $and: [
            {
              $or: [
                {
                  businessId,
                },

                {
                  businessId:
                    businessId.toString(),
                },

                {
                  businessSlug:
                    slug,
                },
              ],
            },

            {
              $or:
                identity,
            },
          ],
        } as any);

    if (!client) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cliente não encontrado nesta empresa.",
        },
        {
          status: 404,
        }
      );
    }

    const appointment =
      await db
        .collection(
          "appointments"
        )
        .findOne({
          _id:
            new ObjectId(
              id
            ),

          $and: [
            {
              $or: [
                {
                  businessId,
                },

                {
                  businessId:
                    businessId.toString(),
                },

                {
                  businessSlug:
                    slug,
                },
              ],
            },

            {
              $or: [
                {
                  clientId:
                    client._id,
                },

                {
                  clientId:
                    client._id.toString(),
                },
              ],
            },
          ],
        } as any);

    if (!appointment) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Agendamento não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const status =
      String(
        appointment.status ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      [
        "cancelado",
        "cancelled",
        "concluido",
        "concluído",
        "completed",
        "faltou",
      ].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este agendamento não pode mais ser cancelado.",
        },
        {
          status: 409,
        }
      );
    }

    const date =
      String(
        appointment.date ||
          ""
      );

    const time =
      String(
        appointment.time ||
          appointment.startTime ||
          ""
      );

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      ) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        time
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Data ou horário do agendamento é inválido.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    Regra inicial:
    cliente pode cancelar até 2 horas antes.

    Depois podemos transformar isso numa configuração
    de cada empresa.
    */

    const appointmentDate =
      new Date(
        `${date}T${time}:00-03:00`
      );

    const minimum =
      new Date(
        Date.now() +
          2 *
            60 *
            60 *
            1000
      );

    if (
      appointmentDate <=
      minimum
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "O cancelamento pelo aplicativo só é permitido até 2 horas antes do horário. Entre em contato com o estabelecimento.",
        },
        {
          status: 409,
        }
      );
    }

    const now =
      new Date();

    await db
      .collection(
        "appointments"
      )
      .updateOne(
        {
          _id:
            appointment._id,
        },
        {
          $set: {
            status:
              "cancelado",

            cancellationSource:
              "customer",

            customerCancelledAt:
              now,

            updatedAt:
              now,
          },
        }
      );

    return NextResponse.json({
      ok: true,

      message:
        "Agendamento cancelado com sucesso.",
    });
  } catch (error) {
    console.error(
      "CUSTOMER CANCEL APPOINTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          "Erro ao cancelar agendamento.",
      },
      {
        status: 500,
      }
    );
  }
}
