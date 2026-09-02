import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import {
  requireBusinessSession,
} from "@/lib/tenant-auth";

import {
  isMonthClosed,
} from "@/lib/monthly-closing";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: NextRequest,
  { params }: Props
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

    const {
      id,
    } =
      await params;

    if (
      !ObjectId.isValid(id)
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

    const appointmentId =
      new ObjectId(id);

    const businessFilters =
      makeBusinessFilters(
        auth.businessId
      );

    const existing =
      await auth.db
        .collection(
          "appointments"
        )
        .findOne({
          $and: [
            {
              _id:
                appointmentId,
            },
            {
              $or:
                businessFilters,
            },
          ],
        } as any);

    if (!existing) {
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

    /*
    =====================================================
    FUNCIONÁRIO
    =====================================================
    */

    if (
      auth.user.role ===
      "employee"
    ) {
      const linkedId =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          linkedId
        ) ||
        String(
          existing.professionalId ||
            ""
        ) !== linkedId
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Você só pode editar os seus próprios agendamentos.",
          },
          {
            status: 403,
          }
        );
      }
    }

    const body =
      await request.json();

    /*
    =====================================================
    SERVIÇOS
    =====================================================
    */

    const rawServiceIds =
      Array.isArray(
        body.serviceIds
      )
        ? body.serviceIds
        : body.serviceId
          ? [
              body.serviceId,
            ]
          : Array.isArray(
              existing.serviceIds
            ) &&
            existing.serviceIds.length >
              0
            ? existing.serviceIds
            : existing.serviceId
              ? [
                  existing.serviceId,
                ]
              : [];

    const serviceIds =
      rawServiceIds
        .map(
          (
            value: unknown
          ) =>
            String(
              value ||
                ""
            ).trim()
        )
        .filter(Boolean);

    if (
      serviceIds.length ===
        0 ||
      serviceIds.some(
        (serviceId: string) =>
          !ObjectId.isValid(
            serviceId
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

    /*
    =====================================================
    PROFISSIONAL / DATA / HORÁRIO
    =====================================================
    */

    let professionalId =
      String(
        body.professionalId ||
          existing.professionalId ||
          ""
      ).trim();

    const date =
      String(
        body.date ||
          existing.date ||
          ""
      ).trim();

    const time =
      String(
        body.time ||
          body.startTime ||
          existing.startTime ||
          existing.time ||
          ""
      ).trim();

    if (
      auth.user.role ===
      "employee"
    ) {
      const linkedId =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          linkedId
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
        linkedId;
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
      !isValidDate(
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

    /*
    =====================================================
    BUSCAR TODOS OS SERVIÇOS
    =====================================================
    */

    const serviceObjectIds =
      serviceIds.map(
        (serviceId: string) =>
          new ObjectId(
            serviceId
          )
      );

    const foundServices =
      await auth.db
        .collection(
          "services"
        )
        .find({
          $and: [
            {
              _id: {
                $in:
                  serviceObjectIds,
              },
            },

            {
              $or:
                businessFilters,
            },

            {
              active: {
                $ne: false,
              },
            },
          ],
        } as any)
        .toArray();

    if (
      foundServices.length !==
      serviceIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Um dos serviços selecionados não existe ou está inativo.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    Mantém a ordem escolhida.
    */

    const services =
      serviceIds
        .map(
          (serviceId: string) =>
            foundServices.find(
              (service) =>
                String(
                  service._id
                ) ===
                serviceId
            )
        )
        .filter(
          Boolean
        ) as any[];

    const totalDuration =
      services.reduce(
        (
          total,
          service
        ) => {
          const duration =
            Number(
              service.duration ||
                30
            );

          return (
            total +
            (
              Number.isFinite(
                duration
              ) &&
              duration > 0
                ? duration
                : 30
            )
          );
        },
        0
      );

    const totalPrice =
      services.reduce(
        (
          total,
          service
        ) => {
          const price =
            Number(
              service.price ||
                0
            );

          return (
            total +
            (
              Number.isFinite(
                price
              )
                ? price
                : 0
            )
          );
        },
        0
      );

    const serviceName =
      services
        .map(
          (service) =>
            String(
              service.name ||
                "Serviço"
            )
        )
        .join(
          " + "
        );

    const endMinutes =
      startMinutes +
      totalDuration;

    if (
      endMinutes >
      24 * 60
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "O horário final do atendimento é inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const endTime =
      minutesToTime(
        endMinutes
      );

    /*
    =====================================================
    PROFISSIONAL
    =====================================================
    */

    const professionalObjectId =
      new ObjectId(
        professionalId
      );

    const professional =
      await auth.db
        .collection(
          "professionals"
        )
        .findOne({
          $and: [
            {
              _id:
                professionalObjectId,
            },

            {
              $or:
                businessFilters,
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
            "Profissional não encontrado ou inativo.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    Se o profissional possui serviços específicos,
    precisa realizar TODOS os selecionados.
    */

    if (
      Array.isArray(
        professional.serviceIds
      ) &&
      professional.serviceIds.length >
        0
    ) {
      const allowed =
        new Set(
          professional.serviceIds.map(
            (
              value: unknown
            ) =>
              String(value)
          )
        );

      const canPerformAll =
        serviceIds.every(
          (serviceId: string) =>
            allowed.has(
              serviceId
            )
        );

      if (!canPerformAll) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Este profissional não realiza todos os serviços selecionados.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
    =====================================================
    CONFLITO
    Ignora o próprio agendamento.
    =====================================================
    */

    const otherAppointments =
      await auth.db
        .collection(
          "appointments"
        )
        .find({
          $and: [
            {
              _id: {
                $ne:
                  appointmentId,
              },
            },

            {
              $or:
                businessFilters,
            },

            {
              professionalId: {
                $in: [
                  professionalId,
                  professionalObjectId,
                ],
              },
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
      otherAppointments.some(
        (
          appointment
        ) => {
          const otherStart =
            getAppointmentStart(
              appointment
            );

          if (
            otherStart ===
            null
          ) {
            return false;
          }

          const otherEnd =
            getAppointmentEnd(
              appointment,
              otherStart
            );

          return overlaps(
            startMinutes,
            endMinutes,
            otherStart,
            otherEnd
          );
        }
      );

    if (
      hasConflict
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esse período já está ocupado para este profissional.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =====================================================
    FECHAMENTO MENSAL
    =====================================================
    */

    const originalMonthClosed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        String(
          existing.date ||
            ""
        )
      );

    const targetMonthClosed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        date
      );

    if (
      originalMonthClosed ||
      targetMonthClosed
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este mês está fechado. Reabra o fechamento antes de editar o agendamento.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =====================================================
    ATUALIZAR
    =====================================================
    */

    const now =
      new Date();

    await auth.db
      .collection(
        "appointments"
      )
      .updateOne(
        {
          _id:
            appointmentId,
        },
        {
          $set: {
            /*
            Compatibilidade com partes antigas:
            primeiro serviço continua em serviceId.
            */

            serviceId:
              services[0]._id,

            serviceIds:
              services.map(
                (service) =>
                  service._id
              ),

            services:
              services.map(
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

            serviceName,

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

            updatedAt:
              now,
          },
        }
      );

    const updated =
      await auth.db
        .collection(
          "appointments"
        )
        .findOne({
          _id:
            appointmentId,
        });

    return NextResponse.json({
      ok: true,

      message:
        "Agendamento atualizado com sucesso.",

      appointment:
        serializeAppointment(
          updated
        ),
    });
  } catch (error) {
    console.error(
      "EDIT APPOINTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao editar agendamento.",
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

function makeBusinessFilters(
  businessId: unknown
): any[] {
  const value =
    String(
      businessId ||
        ""
    ).trim();

  const filters: any[] =
    [];

  if (value) {
    filters.push({
      businessId:
        value,
    });
  }

  if (
    ObjectId.isValid(
      value
    )
  ) {
    filters.push({
      businessId:
        new ObjectId(
          value
        ),
    });
  }

  return filters;
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

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  const parsed =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  return (
    parsed.getUTCFullYear() ===
      year &&
    parsed.getUTCMonth() ===
      month - 1 &&
    parsed.getUTCDate() ===
      day
  );
}

function timeToMinutes(
  value: string
): number | null {
  const match =
    /^(\d{1,2}):(\d{2})$/.exec(
      String(
        value ||
          ""
      ).trim()
    );

  if (!match) {
    return null;
  }

  const hours =
    Number(
      match[1]
    );

  const minutes =
    Number(
      match[2]
    );

  if (
    !Number.isInteger(
      hours
    ) ||
    !Number.isInteger(
      minutes
    ) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return (
    hours *
      60 +
    minutes
  );
}

function minutesToTime(
  value: number
) {
  const hours =
    Math.floor(
      value /
        60
    );

  const minutes =
    value %
    60;

  return `${String(
    hours
  ).padStart(
    2,
    "0"
  )}:${String(
    minutes
  ).padStart(
    2,
    "0"
  )}`;
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

  const end =
    timeToMinutes(
      String(
        appointment.endTime ||
          ""
      )
    );

  if (
    end !== null
  ) {
    return end;
  }

  const duration =
    Number(
      appointment.duration ||
        appointment.serviceDuration ||
        30
    );

  return (
    start +
    (
      Number.isFinite(
        duration
      )
        ? duration
        : 30
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
    startA <
      endB &&
    endA >
      startB
  );
}

function serializeAppointment(
  appointment: any
) {
  if (!appointment) {
    return null;
  }

  return {
    ...appointment,

    _id:
      appointment._id
        ? String(
            appointment._id
          )
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

    serviceIds:
      Array.isArray(
        appointment.serviceIds
      )
        ? appointment.serviceIds.map(
            String
          )
        : [],

    services:
      Array.isArray(
        appointment.services
      )
        ? appointment.services.map(
            (
              service: any
            ) => ({
              ...service,

              serviceId:
                service.serviceId
                  ? String(
                      service.serviceId
                    )
                  : undefined,
            })
          )
        : [],

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
