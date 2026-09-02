import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";

import {
  isMonthClosed,
} from "@/lib/monthly-closing";

import {
  acquireBookingLock,
  getPublicBookingAvailability,
  releaseBookingLock,
} from "@/lib/public-booking-availability";

import {
  ensureVelltoIndexes,
} from "@/lib/vellto-indexes";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
=========================================================
GET - LISTAR AGENDAMENTOS
=========================================================
*/

export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const url = new URL(request.url);

    const date = String(
      url.searchParams.get("date") || ""
    ).trim();

    const businessFilters = makeBusinessFilters(
      auth.businessId
    );

    const filter: any = {
      $or: businessFilters,
    };

    if (auth.user.role === "employee") {
      const employeeProfessionalId = String(
        auth.user.professionalId || ""
      );

      if (!ObjectId.isValid(employeeProfessionalId)) {
        return NextResponse.json(
          {
            ok: false,
            message: "Profissional não vinculado ao usuário",
          },
          {
            status: 403,
          }
        );
      }

      filter.professionalId = {
        $in: [
          employeeProfessionalId,
          new ObjectId(employeeProfessionalId),
        ],
      };
    }

    if (date) {
      filter.date = date;
    }

    const appointments = await auth.db
      .collection("appointments")
      .find(filter)
      .sort({
        date: 1,
        startTime: 1,
        time: 1,
        createdAt: 1,
      })
      .toArray();

    return NextResponse.json({
      ok: true,

      viewer: {
        role: auth.user.role || "owner",
        professionalId: auth.user.professionalId
          ? String(auth.user.professionalId)
          : null,
      },

      appointments: appointments.map(
        serializeAppointment
      ),
    });
  } catch (error) {
    console.error(
      "GET APPOINTMENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao carregar agendamentos",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
POST - CRIAR AGENDAMENTO
=========================================================
*/

export async function POST(
  request: NextRequest
) {
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

    /*
    Índices são idempotentes.
    Não bloqueamos o agendamento
    caso a criação de algum índice falhe.
    */
    void ensureVelltoIndexes(
      auth.db
    );

    const body =
      await request.json();

    const clientId =
      String(
        body.clientId ||
          ""
      ).trim();

    const serviceIds =
      (
        Array.isArray(
          body.serviceIds
        )
          ? body.serviceIds
          : [
              body.serviceId,
            ]
      )
        .map(
          (
            value: unknown
          ) =>
            String(
              value ||
                ""
            ).trim()
        )
        .filter(
          Boolean
        );

    let professionalId =
      String(
        body.professionalId ||
          ""
      ).trim();

    const date =
      String(
        body.date ||
          ""
      ).trim();

    const time =
      String(
        body.time ||
          body.startTime ||
          ""
      ).trim();

    /*
    =====================================================
    FUNCIONÁRIO
    =====================================================
    */

    if (
      auth.user.role ===
      "employee"
    ) {
      const linked =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          linked
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Seu usuário não está vinculado a um profissional.",
          },
          {
            status: 403,
          }
        );
      }

      professionalId =
        linked;
    }

    /*
    =====================================================
    VALIDAÇÕES
    =====================================================
    */

    if (
      !ObjectId.isValid(
        clientId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cliente inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      serviceIds.length ===
        0 ||
      serviceIds.some(
        (
          id: string
        ) =>
          !ObjectId.isValid(
            id
          )
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Selecione pelo menos um serviço válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      new Set(
        serviceIds
      ).size !==
      serviceIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Existem serviços duplicados.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ObjectId.isValid(
        professionalId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Profissional inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Data inválida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(
        time
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Horário inválido.",
        },
        {
          status: 400,
        }
      );
    }

    /*
    =====================================================
    FECHAMENTO MENSAL
    =====================================================
    */

    const closed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        date
      );

    if (closed) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este mês está fechado. Reabra o fechamento antes de criar um agendamento.",
        },
        {
          status: 409,
        }
      );
    }

    const businessFilters =
      makeBusinessFilters(
        auth.businessId
      );

    /*
    =====================================================
    CLIENTE
    =====================================================
    */

    const clientObjectId =
      new ObjectId(
        clientId
      );

    const client =
      await auth.db
        .collection(
          "clients"
        )
        .findOne({
          $and: [
            {
              _id:
                clientObjectId,
            },
            {
              $or:
                businessFilters,
            },
          ],
        } as any);

    if (!client) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cliente não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    =====================================================
    DISPONIBILIDADE AUTORITATIVA
    =====================================================
    */

    const availability =
      await getPublicBookingAvailability(
        auth.db,
        {
          slug:
            String(
              auth.business.slug ||
                ""
            ),

          serviceIds,

          professionalId,

          date,
        }
      );

    if (
      !availability.ok
    ) {
      return NextResponse.json(
        {
          ok: false,

          message:
            availability.message ||
            "Não foi possível validar o horário.",
        },
        {
          status:
            availability.status,
        }
      );
    }

    const slotAvailable =
      (
        availability.slots ||
        []
      ).some(
        (slot) =>
          slot.time ===
          time
      );

    if (
      !slotAvailable
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            availability.message ||
            "Esse horário não está disponível.",
        },
        {
          status: 409,
        }
      );
    }

    const orderedServices =
      availability.services ||
      [];

    const professional =
      availability.professional;

    if (
      !professional ||
      orderedServices.length !==
        serviceIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Não foi possível validar serviços e profissional.",
        },
        {
          status: 409,
        }
      );
    }

    const totalDuration =
      Number(
        availability.totalDuration ||
          0
      );

    const totalPrice =
      Number(
        availability.totalPrice ||
          0
      );

    const startMinutes =
      timeToMinutes(
        time
      );

    if (
      startMinutes ===
      null
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Horário inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const endMinutes =
      startMinutes +
      totalDuration;

    const endTime =
      minutesToTime(
        endMinutes
      );

    /*
    =====================================================
    MENSALIDADE / COBERTURA
    =====================================================
    */

    const membershipClientFilters =
      makeIdFieldFilters(
        "clientId",
        clientId
      );

    const memberships =
      await auth.db
        .collection(
          "memberships"
        )
        .find({
          $and: [
            {
              $or:
                businessFilters,
            },

            {
              $or:
                membershipClientFilters,
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

    const now =
      new Date();

    const membership =
      memberships.find(
        (item) => {
          if (
            item.expiresAt
          ) {
            const expiration =
              parseExpirationDate(
                item.expiresAt
              );

            if (
              expiration &&
              expiration <
                now
            ) {
              return false;
            }
          }

          /*
          Planos antigos não possuem serviceIds:
          continuam cobrindo qualquer serviço.

          Planos novos:
          precisam cobrir pelo menos um serviço.
          */
          const allowed =
            Array.isArray(
              item.serviceIds
            )
              ? item.serviceIds
                  .map(
                    (
                      value: unknown
                    ) =>
                      String(
                        value
                      )
                  )
              : [];

          if (
            allowed.length ===
            0
          ) {
            return true;
          }

          return serviceIds.some(
            (serviceId: string) =>
              allowed.includes(
                serviceId
              )
          );
        }
      );

    let coveredServiceIds:
      string[] = [];

    let membershipExtraAmount =
      0;

    if (membership) {
      const allowed =
        Array.isArray(
          membership.serviceIds
        )
          ? membership.serviceIds.map(
              (
                value: unknown
              ) =>
                String(value)
            )
          : [];

      if (
        allowed.length ===
        0
      ) {
        coveredServiceIds =
          [...serviceIds];
      } else {
        coveredServiceIds =
          serviceIds.filter(
            (serviceId: string) =>
              allowed.includes(
                serviceId
              )
          );
      }

      membershipExtraAmount =
        orderedServices
          .filter(
            (service) =>
              !coveredServiceIds.includes(
                String(
                  service._id
                )
              )
          )
          .reduce(
            (
              total,
              service
            ) =>
              total +
              Number(
                service.price ||
                  0
              ),
            0
          );
    }

    /*
    =====================================================
    LOCK DE CONCORRÊNCIA
    =====================================================
    */

    const lockBusinessId =
      auth.businessId
        instanceof ObjectId
        ? auth.businessId
        : new ObjectId(
            String(
              auth.businessId
            )
          );

    const professionalObjectId =
      new ObjectId(
        professionalId
      );

    const lock =
      await acquireBookingLock(
        auth.db,
        {
          businessId:
            lockBusinessId,

          professionalId:
            professionalObjectId,

          date,
        }
      );

    if (!lock) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A agenda está sendo atualizada. Tente novamente.",
        },
        {
          status: 409,
        }
      );
    }

    try {
      /*
      Recalcula depois do lock.
      */

      const finalAvailability =
        await getPublicBookingAvailability(
          auth.db,
          {
            slug:
              String(
                auth.business.slug ||
                  ""
              ),

            serviceIds,

            professionalId,

            date,
          }
        );

      const stillAvailable =
        finalAvailability.ok &&
        (
          finalAvailability.slots ||
          []
        ).some(
          (slot) =>
            slot.time ===
            time
        );

      if (
        !stillAvailable
      ) {
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

      const appointment = {
        businessId:
          auth.businessId,

        clientId:
          clientObjectId,

        clientName:
          String(
            client.name ||
              ""
          ),

        clientPhone:
          String(
            client.phone ||
              ""
          ),

        serviceId:
          orderedServices[0]._id,

        serviceIds:
          orderedServices.map(
            (service) =>
              service._id
          ),

        services:
          orderedServices.map(
            (service) => ({
              serviceId:
                service._id,

              name:
                String(
                  service.name ||
                    "Serviço"
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

        serviceName:
          orderedServices
            .map(
              (service) =>
                String(
                  service.name ||
                    "Serviço"
                )
            )
            .join(
              " + "
            ),

        professionalId:
          professionalObjectId,

        professionalName:
          String(
            professional.name ||
              ""
          ),

        date,

        time,

        startTime:
          time,

        endTime,

        startMinutes,

        endMinutes,

        duration:
          totalDuration,

        serviceDuration:
          totalDuration,

        price:
          totalPrice,

        status:
          "pendente",

        source:
          "dashboard",

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

        membershipCoveredServiceIds:
          coveredServiceIds,

        membershipExtraAmount,

        membershipUsageConsumed:
          false,

        countedInClient:
          false,

        createdAt:
          now,

        updatedAt:
          now,
      };

      const result =
        await auth.db
          .collection(
            "appointments"
          )
          .insertOne(
            appointment
          );

      if (membership) {
        await auth.db
          .collection(
            "memberships"
          )
          .updateOne(
            {
              _id:
                membership._id,
            },
            {
              $addToSet: {
                professionalIds:
                  professionalObjectId,
              },

              $set: {
                updatedAt:
                  now,
              },
            }
          );
      }

      return NextResponse.json(
        {
          ok: true,

          message:
            membership
              ? membershipExtraAmount >
                0
                ? `Agendamento criado. O plano cobre parte do atendimento e há ${formatMoney(
                    membershipExtraAmount
                  )} em serviços extras.`
                : `Agendamento criado. Cliente possui ${Number(
                    membership.remainingUses ||
                      0
                  )} uso(s) no plano.`
              : "Agendamento criado com sucesso.",

          appointment: {
            ...serializeAppointment(
              appointment
            ),

            _id:
              result.insertedId.toString(),
          },
        },
        {
          status: 201,
        }
      );
    } finally {
      await releaseBookingLock(
        auth.db,
        lock
      );
    }
  } catch (error) {
    console.error(
      "POST APPOINTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao criar agendamento",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
OPTIONS
=========================================================
*/

export async function OPTIONS() {
  return NextResponse.json({
    ok: true,
  });
}

/*
=========================================================
HELPERS
=========================================================
*/

function formatMoney(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    value ||
      0
  );
}

function makeBusinessFilters(
  businessId: unknown
): any[] {
  const value = String(
    businessId || ""
  ).trim();

  const filters: any[] = [];

  if (value) {
    filters.push({
      businessId: value,
    });
  }

  if (ObjectId.isValid(value)) {
    filters.push({
      businessId:
        new ObjectId(value),
    });
  }

  return filters;
}

function makeIdFieldFilters(
  field: string,
  value: string
): any[] {
  const filters: any[] = [];

  filters.push({
    [field]: value,
  });

  if (ObjectId.isValid(value)) {
    filters.push({
      [field]:
        new ObjectId(value),
    });
  }

  return filters;
}

function serializeAppointment(
  appointment: any
) {
  return {
    ...appointment,

    _id: appointment._id
      ? String(appointment._id)
      : undefined,

    businessId:
      appointment.businessId
        ? String(
            appointment.businessId
          )
        : undefined,

    clientId:
      appointment.clientId
        ? String(
            appointment.clientId
          )
        : undefined,

    serviceId:
      appointment.serviceId
        ? String(
            appointment.serviceId
          )
        : undefined,

    professionalId:
      appointment.professionalId
        ? String(
            appointment.professionalId
          )
        : undefined,

    membershipId:
      appointment.membershipId
        ? String(
            appointment.membershipId
          )
        : null,
  };
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

  const [hour, minute] =
    value
      .split(":")
      .map(Number);

  return hour * 60 + minute;
}

function minutesToTime(
  value: number
) {
  const hour =
    Math.floor(value / 60);

  const minute =
    value % 60;

  return `${String(hour).padStart(
    2,
    "0"
  )}:${String(minute).padStart(
    2,
    "0"
  )}`;
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

function isValidDate(
  value: string
) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }

  const [year, month, day] =
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

  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
}

function parseExpirationDate(
  value: unknown
): Date | null {
  if (!value) {
    return null;
  }

  const text =
    String(value).trim();

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    const [year, month, day] =
      text
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
    new Date(text);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date;
}
