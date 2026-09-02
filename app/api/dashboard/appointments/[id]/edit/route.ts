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
    } = await params;

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

    const appointmentId =
      new ObjectId(
        id
      );

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
    FUNCIONÁRIO SÓ ALTERA O PRÓPRIO AGENDAMENTO
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
        ) !==
          linkedId
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

    const serviceId =
      String(
        body.serviceId ||
          existing.serviceId ||
          ""
      ).trim();

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

    /*
    =====================================================
    FUNCIONÁRIO SEMPRE É FORÇADO AO PRÓPRIO PROFISSIONAL
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
        serviceId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Serviço inválido.",
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

    const serviceObjectId =
      new ObjectId(
        serviceId
      );

    const professionalObjectId =
      new ObjectId(
        professionalId
      );

    /*
    =====================================================
    SERVIÇO
    =====================================================
    */

    const service =
      await auth.db
        .collection(
          "services"
        )
        .findOne({
          $and: [
            {
              _id:
                serviceObjectId,
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

    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Serviço não encontrado ou inativo.",
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

    const duration =
      Number(
        service.duration ||
          30
      );

    if (
      !Number.isFinite(
        duration
      ) ||
      duration <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Duração do serviço inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const endMinutes =
      startMinutes +
      duration;

    const endTime =
      minutesToTime(
        endMinutes
      );

    /*
    =====================================================
    CONFLITO
    Ignora o próprio agendamento
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
            timeToMinutes(
              String(
                appointment.startTime ||
                  appointment.time ||
                  ""
              )
            );

          if (
            otherStart ===
            null
          ) {
            return false;
          }

          let otherEnd =
            timeToMinutes(
              String(
                appointment.endTime ||
                  ""
              )
            );

          if (
            otherEnd ===
            null
          ) {
            otherEnd =
              otherStart +
              Number(
                appointment.duration ||
                  appointment.serviceDuration ||
                  30
              );
          }

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
            "Esse horário já está ocupado para este profissional.",
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
            serviceId:
              serviceObjectId,

            serviceName:
              String(
                service.name ||
                  ""
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

            duration,

            serviceDuration:
              duration,

            price:
              Number(
                service.price ||
                  0
              ),

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
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
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
    hours * 60 +
    minutes
  );
}

function minutesToTime(
  value: number
) {
  const hours =
    Math.floor(
      value / 60
    );

  const minutes =
    value % 60;

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
