import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";

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

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const clientId = String(
      body.clientId || ""
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
          (value: unknown) =>
            String(
              value || ""
            ).trim()
        )
        .filter(Boolean);

    const serviceId =
      serviceIds[0] ||
      "";

    let professionalId = String(
      body.professionalId || ""
    ).trim();

    const date = String(
      body.date || ""
    ).trim();

    const time = String(
      body.time ||
        body.startTime ||
        ""
    ).trim();

    if (
      auth.user.role ===
      "employee"
    ) {
      const linkedProfessionalId =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          linkedProfessionalId
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
        linkedProfessionalId;
    }

    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Cliente inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      serviceIds.length === 0 ||
      serviceIds.some(
        (id: string) =>
          !ObjectId.isValid(
            id
          )
      )
    ) {
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

    if (!ObjectId.isValid(professionalId)) {
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

    if (!isValidDate(date)) {
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

    const startMinutes = timeToMinutes(time);

    if (startMinutes === null) {
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

    const clientObjectId = new ObjectId(clientId);
    const serviceObjectId = new ObjectId(serviceId);
    const professionalObjectId =
      new ObjectId(professionalId);

    const businessFilters = makeBusinessFilters(
      auth.businessId
    );

    /*
    =====================================================
    CLIENTE
    =====================================================
    */

    const client = await auth.db
      .collection("clients")
      .findOne({
        $and: [
          {
            _id: clientObjectId,
          },
          {
            $or: businessFilters,
          },
        ],
      } as any);

    if (!client) {
      return NextResponse.json(
        {
          ok: false,
          message: "Cliente não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    /*
    =====================================================
    SERVIÇO
    =====================================================
    */

    const service = await auth.db
      .collection("services")
      .findOne({
        $and: [
          {
            _id: serviceObjectId,
          },
          {
            $or: businessFilters,
          },
          {
            active: {
              $ne: false,
            },
          },
        ],
      } as any);

    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Serviço não encontrado ou inativo",
        },
        {
          status: 404,
        }
      );
    }

    const allServices =
      serviceIds.length === 1
        ? [
            service,
          ]
        : await auth.db
            .collection(
              "services"
            )
            .find({
              _id: {
                $in:
                  serviceIds.map(
                    (id: string) =>
                      new ObjectId(
                        id
                      )
                  ),
              },

              $or:
                businessFilters,

              active: {
                $ne: false,
              },
            } as any)
            .toArray();

    if (
      allServices.length !==
      serviceIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Um dos serviços selecionados não foi encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const orderedServices =
      serviceIds.map(
        (id: string) =>
          allServices.find(
            (item) =>
              String(
                item._id
              ) === id
          )
      ).filter(Boolean) as any[];

    /*
    =====================================================
    PROFISSIONAL
    =====================================================
    */

    const professional = await auth.db
      .collection("professionals")
      .findOne({
        $and: [
          {
            _id: professionalObjectId,
          },
          {
            $or: businessFilters,
          },
          {
            active: {
              $ne: false,
            },
          },
        ],
      } as any);

    if (!professional) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Profissional não encontrado ou inativo",
        },
        {
          status: 404,
        }
      );
    }

    /*
    =====================================================
    DURAÇÃO
    =====================================================
    */

    const duration =
      orderedServices.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.duration ||
              30
          ),
        0
      );

    if (
      !Number.isFinite(duration) ||
      duration <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Duração do serviço inválida",
        },
        {
          status: 400,
        }
      );
    }

    const endMinutes =
      startMinutes + duration;

    const endTime =
      minutesToTime(endMinutes);

    /*
    =====================================================
    VERIFICAR CONFLITO
    =====================================================
    */

    const existingAppointments = await auth.db
      .collection("appointments")
      .find({
        $and: [
          {
            $or: businessFilters,
          },
          {
            professionalId:
              professionalObjectId,
          },
          {
            date,
          },
          {
            status: {
              $nin: [
                "cancelado",
                "cancelled",
                "faltou",
              ],
            },
          },
        ],
      } as any)
      .toArray();

    const hasConflict =
      existingAppointments.some(
        (appointment) => {
          const existingStart =
            timeToMinutes(
              String(
                appointment.startTime ||
                  appointment.time ||
                  ""
              )
            );

          if (existingStart === null) {
            return false;
          }

          let existingEnd =
            timeToMinutes(
              String(
                appointment.endTime || ""
              )
            );

          if (existingEnd === null) {
            existingEnd =
              existingStart +
              Number(
                appointment.duration ||
                  appointment.serviceDuration ||
                  30
              );
          }

          return overlaps(
            startMinutes,
            endMinutes,
            existingStart,
            existingEnd
          );
        }
      );

    if (hasConflict) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esse horário já está ocupado.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =====================================================
    VERIFICAR MENSALIDADE PAGA
    =====================================================
    */

    const membershipClientFilters =
      makeIdFieldFilters(
        "clientId",
        clientId
      );

    const memberships = await auth.db
      .collection("memberships")
      .find({
        $and: [
          {
            $or: businessFilters,
          },
          {
            $or: membershipClientFilters,
          },
          {
            active: {
              $ne: false,
            },
          },
          {
            paymentStatus: "paid",
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

    const now = new Date();

    const membership = memberships.find(
      (item) => {
        if (!item.expiresAt) {
          return true;
        }

        const expiration =
          parseExpirationDate(
            item.expiresAt
          );

        if (!expiration) {
          return true;
        }

        return expiration >= now;
      }
    );

    /*
    =====================================================
    CRIAR AGENDAMENTO
    =====================================================
    */

    const appointment = {
      businessId: auth.businessId,

      clientId: clientObjectId,
      clientName: String(
        client.name || ""
      ),
      clientPhone: String(
        client.phone || ""
      ),

      serviceId:
        serviceObjectId,

      serviceIds:
        orderedServices.map(
          (item) =>
            item._id
        ),

      services:
        orderedServices.map(
          (item) => ({
            serviceId:
              item._id,

            name:
              String(
                item.name ||
                  ""
              ),

            duration:
              Number(
                item.duration ||
                  30
              ),

            price:
              Number(
                item.price ||
                  0
              ),
          })
        ),

      serviceName:
        orderedServices
          .map(
            (item) =>
              String(
                item.name ||
                  ""
              )
          )
          .join(" + "),

      professionalId:
        professionalObjectId,
      professionalName: String(
        professional.name || ""
      ),

      date,

      time,
      startTime: time,
      endTime,

      duration,
      serviceDuration: duration,

      price:
        orderedServices.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.price ||
                0
            ),
          0
        ),

      status: "pendente",

      hasActiveMembership:
        Boolean(membership),

      membershipId:
        membership?._id || null,

      membershipPlanName:
        membership
          ? String(
              membership.planName ||
                membership.name ||
                "Plano mensal"
            )
          : "",

      membershipRemainingBefore:
        membership
          ? Number(
              membership.remainingUses || 0
            )
          : null,

      membershipUsageConsumed: false,

      countedInClient: false,

      createdAt: now,
      updatedAt: now,
    };

    const result = await auth.db
      .collection("appointments")
      .insertOne(appointment);

    if (membership) {
      await auth.db
        .collection("memberships")
        .updateOne(
          {
            _id: membership._id,
          },
          {
            $addToSet: {
              professionalIds:
                professionalObjectId,
            },
            $set: {
              updatedAt: now,
            },
          }
        );
    }

    return NextResponse.json(
      {
        ok: true,

        message: membership
          ? `Agendamento criado. Cliente possui ${Number(
              membership.remainingUses || 0
            )} corte(s) no plano.`
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
  } catch (error) {
    console.error(
      "POST APPOINTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao criar agendamento",
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
