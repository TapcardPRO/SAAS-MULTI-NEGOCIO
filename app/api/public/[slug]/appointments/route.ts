import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import {
  computeAvailability,
  getEligibleProfessionals,
  normalizePhone,
  toMinutes,
} from "@/lib/booking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: Props
) {
  try {
    const { slug } = await params;

    const body = await request.json();

    const serviceId = String(
      body.serviceId || ""
    ).trim();

    const requestedProfessionalId = String(
      body.professionalId || ""
    ).trim();

    const date = String(
      body.date || ""
    ).trim();

    const time = String(
      body.time || ""
    ).trim();

    const clientName = String(
      body.clientName || ""
    ).trim();

    const clientPhone = String(
      body.clientPhone || ""
    ).trim();

    const clientEmail = String(
      body.clientEmail || ""
    )
      .trim()
      .toLowerCase();

    const notes = String(
      body.notes || ""
    ).trim();

    /*
    =====================================================
    VALIDAÇÕES
    =====================================================
    */

    if (!ObjectId.isValid(serviceId)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Serviço inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      requestedProfessionalId !== "any" &&
      !ObjectId.isValid(requestedProfessionalId)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Data inválida",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Horário inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (!clientName) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe seu nome",
        },
        {
          status: 400,
        }
      );
    }

    const phoneNormalized =
      normalizePhone(clientPhone);

    if (
      phoneNormalized.length < 10
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um WhatsApp válido",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    EMPRESA
    =====================================================
    */

    const db = await getDb();

    const business = await db
      .collection("businesses")
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
            "Empresa indisponível",
        },
        {
          status: 404,
        }
      );
    }

    const businessId =
      business._id;

    const tenantFilters: any[] = [
      {
        businessId,
      },

      {
        businessId:
          businessId.toString(),
      },

      {
        businessSlug: slug,
      },
    ];

    /*
    =====================================================
    SERVIÇO
    =====================================================
    */

    const serviceObjectId =
      new ObjectId(serviceId);

    const service = await db
      .collection("services")
      .findOne({
        _id:
          serviceObjectId,

        active: {
          $ne: false,
        },

        $or:
          tenantFilters,
      } as any);

    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Serviço não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    /*
    =====================================================
    PROFISSIONAL
    =====================================================
    */

    let professional: any =
      null;

    if (
      requestedProfessionalId !==
      "any"
    ) {
      const professionalObjectId =
        new ObjectId(
          requestedProfessionalId
        );

      professional = await db
        .collection("professionals")
        .findOne({
          _id:
            professionalObjectId,

          active: {
            $ne: false,
          },

          $or:
            tenantFilters,
        } as any);

      if (!professional) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Profissional não encontrado",
          },
          {
            status: 404,
          }
        );
      }

      const availability =
        await computeAvailability(
          db,
          {
            businessId,
            professionalId:
              professional._id,
            serviceId:
              service._id,
            date,
          }
        );

      if (
        !availability.slots.includes(
          time
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Esse horário não está mais disponível",
          },
          {
            status: 409,
          }
        );
      }
    } else {
      const professionals =
        await getEligibleProfessionals(
          db,
          businessId,
          service._id
        );

      for (
        const candidate of professionals
      ) {
        const availability =
          await computeAvailability(
            db,
            {
              businessId,
              professionalId:
                candidate._id,
              serviceId:
                service._id,
              date,
            }
          );

        if (
          availability.slots.includes(
            time
          )
        ) {
          professional =
            candidate;

          break;
        }
      }

      if (!professional) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Nenhum profissional disponível nesse horário",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
    =====================================================
    CLIENTE
    =====================================================
    */

    let client = await db
      .collection("clients")
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
            ],
          },

          {
            $or: [
              {
                phoneNormalized,
              },
              {
                phoneNorm:
                  phoneNormalized,
              },
              {
                phone:
                  clientPhone,
              },
            ],
          },
        ],
      } as any);

    const now =
      new Date();

    if (!client) {
      const result = await db
        .collection("clients")
        .insertOne({
          businessId,

          name:
            clientName,

          phone:
            clientPhone,

          phoneNormalized,

          /*
          Mantemos os dois temporariamente
          para compatibilidade com registros antigos.
          */
          phoneNorm:
            phoneNormalized,

          email:
            clientEmail,

          notes:
            "",

          active:
            true,

          visitsCount:
            0,

          totalVisits:
            0,

          totalSpent:
            0,

          firstVisitAt:
            null,

          lastVisitAt:
            null,

          lastVisit:
            null,

          createdAt:
            now,

          updatedAt:
            now,
        });

      client = await db
        .collection("clients")
        .findOne({
          _id:
            result.insertedId,
        });
    } else {
      await db
        .collection("clients")
        .updateOne(
          {
            _id:
              client._id,
          },
          {
            $set: {
              name:
                clientName,

              phone:
                clientPhone,

              phoneNormalized,

              phoneNorm:
                phoneNormalized,

              email:
                clientEmail ||
                client.email ||
                "",

              updatedAt:
                now,
            },
          }
        );
    }

    if (!client) {
      throw new Error(
        "Falha ao criar cliente"
      );
    }

    /*
    =====================================================
    HORÁRIO / DURAÇÃO
    =====================================================
    */

    const duration =
      Math.max(
        5,
        Number(
          service.duration ||
            30
        )
      );

    const startMinutes =
      toMinutes(time);

    const endMinutes =
      startMinutes +
      duration;

    const endTime =
      minutesToTime(
        endMinutes
      );

    /*
    =====================================================
    VERIFICAÇÃO FINAL DE COLISÃO
    =====================================================

    Aqui verificamos também agendamentos criados pelo painel,
    que podem ter startTime/endTime em vez de startMinutes.
    */

    const appointments =
      await db
        .collection(
          "appointments"
        )
        .find({
          date,

          professionalId:
            professional._id,

          status: {
            $nin: [
              "cancelado",
              "cancelled",
              "faltou",
            ],
          },

          $or: [
            {
              businessId,
            },
            {
              businessId:
                businessId.toString(),
            },
          ],
        } as any)
        .toArray();

    const collision =
      appointments.some(
        (
          appointment
        ) => {
          const existingStart =
            getAppointmentStart(
              appointment
            );

          if (
            existingStart ===
            null
          ) {
            return false;
          }

          const existingEnd =
            getAppointmentEnd(
              appointment,
              existingStart
            );

          return overlaps(
            startMinutes,
            endMinutes,
            existingStart,
            existingEnd
          );
        }
      );

    if (collision) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esse horário acabou de ser reservado. Escolha outro.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =====================================================
    VERIFICAR MENSALIDADE DO CLIENTE
    =====================================================
    */

    const memberships =
      await db
        .collection(
          "memberships"
        )
        .find({
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

            {
              active: {
                $ne: false,
              },
            },

            {
              paymentStatus:
                "paid",
            },

            {
              remainingUses: {
                $gt: 0,
              },
            },
          ],
        } as any)
        .sort({
          createdAt: -1,
        })
        .toArray();

    const membership =
      memberships.find(
        (item) => {
          if (
            !item.expiresAt
          ) {
            return true;
          }

          const expiration =
            parseExpirationDate(
              item.expiresAt
            );

          if (!expiration) {
            return true;
          }

          return (
            expiration >=
            now
          );
        }
      );

    /*
    =====================================================
    CRIAR AGENDAMENTO
    =====================================================
    */

    const appointment = {
      businessId,

      clientId:
        client._id,

      clientName,

      clientPhone,

      clientEmail,

      serviceId:
        service._id,

      serviceName:
        String(
          service.name ||
            "Serviço"
        ),

      price:
        Number(
          service.price ||
            0
        ),

      duration,

      serviceDuration:
        duration,

      professionalId:
        professional._id,

      professionalName:
        String(
          professional.name ||
            "Profissional"
        ),

      date,

      time,

      startTime:
        time,

      endTime,

      startMinutes,

      endMinutes,

      status:
        "pendente",

      notes,

      source:
        "public",

      hasActiveMembership:
        Boolean(
          membership
        ),

      membershipId:
        membership?._id ||
        null,

      membershipPlanName:
        membership
          ? String(
              membership.planName ||
                "Plano mensal"
            )
          : "",

      membershipRemainingBefore:
        membership
          ? Number(
              membership.remainingUses ||
                0
            )
          : null,

      membershipUsageConsumed:
        false,

      countedInClient:
        false,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const inserted = await db
      .collection(
        "appointments"
      )
      .insertOne(
        appointment
      );

    return NextResponse.json(
      {
        ok: true,

        message:
          "Agendamento realizado com sucesso",

        appointment: {
          id:
            inserted.insertedId.toString(),

          ...appointment,

          businessId:
            businessId.toString(),

          clientId:
            client._id.toString(),

          serviceId:
            service._id.toString(),

          professionalId:
            professional._id.toString(),

          membershipId:
            membership?._id
              ? membership._id.toString()
              : null,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST PUBLIC APPOINTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao realizar agendamento",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
HELPERS
=========================================================
*/

function minutesToTime(
  value: number
) {
  const hour =
    Math.floor(
      value / 60
    );

  const minute =
    value % 60;

  return `${String(
    hour
  ).padStart(
    2,
    "0"
  )}:${String(
    minute
  ).padStart(
    2,
    "0"
  )}`;
}

function timeToMinutes(
  value: string
): number | null {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      value
    )
  ) {
    return null;
  }

  const [
    hour,
    minute,
  ] = value
    .split(":")
    .map(Number);

  return (
    hour * 60 +
    minute
  );
}

function getAppointmentStart(
  appointment: any
): number | null {
  if (
    Number.isFinite(
      Number(
        appointment.startMinutes
      )
    )
  ) {
    return Number(
      appointment.startMinutes
    );
  }

  return timeToMinutes(
    String(
      appointment.startTime ||
        appointment.time ||
        ""
    )
  );
}

function getAppointmentEnd(
  appointment: any,
  start: number
) {
  if (
    Number.isFinite(
      Number(
        appointment.endMinutes
      )
    )
  ) {
    return Number(
      appointment.endMinutes
    );
  }

  const storedEnd =
    timeToMinutes(
      String(
        appointment.endTime ||
          ""
      )
    );

  if (
    storedEnd !== null
  ) {
    return storedEnd;
  }

  return (
    start +
    Number(
      appointment.duration ||
        appointment.serviceDuration ||
        30
    )
  );
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return (
    startA < endB &&
    endA > startB
  );
}

function parseExpirationDate(
  value: unknown
): Date | null {
  if (!value) {
    return null;
  }

  const text =
    String(
      value
    ).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    const [
      year,
      month,
      day,
    ] = text
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    );
  }

  const date =
    new Date(
      text
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}