import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DaySchedule = {
  enabled: boolean;
  start: string;
  end: string;
  breakEnabled: boolean;
  breakStart: string;
  breakEnd: string;
};

type WeeklySchedule = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

type ScheduleBlock = {
  date: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  reason?: string;
};

const weekKeys: Array<keyof WeeklySchedule> = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireBusinessSession();

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

    const url =
      new URL(request.url);

    const appointmentId =
      String(
        url.searchParams.get(
          "appointmentId"
        ) || ""
      ).trim();

    const rawServiceIds =
      String(
        url.searchParams.get(
          "serviceIds"
        ) ||
        url.searchParams.get(
          "serviceId"
        ) ||
        ""
      ).trim();

    const serviceIds: string[] =
      rawServiceIds
        .split(",")
        .map(
          (value: string) =>
            value.trim()
        )
        .filter(Boolean);

    const serviceId =
      serviceIds[0] || "";

    let professionalId =
      String(
        url.searchParams.get("professionalId") || ""
      ).trim();

    const date =
      String(
        url.searchParams.get("date") || ""
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
              "Profissional não vinculado ao usuário",
          },
          {
            status: 403,
          }
        );
      }

      professionalId =
        linkedProfessionalId;
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

    if (
      !professionalId ||
      !ObjectId.isValid(
        professionalId
      )
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

    if (!isValidDateString(date)) {
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

    const businessId =
      auth.businessId;

    const serviceObjectId =
      new ObjectId(serviceId);

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
        .collection("services")
        .findOne({
          _id:
            serviceObjectId,

          businessId,

          active: {
            $ne: false,
          },
        });

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

    const selectedServices =
      serviceIds.length > 1
        ? await auth.db
            .collection("services")
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
              businessId,
              active: {
                $ne: false,
              },
            } as any)
            .toArray()
        : [
            service,
          ];

    if (
      selectedServices.length !==
      serviceIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Um dos serviços selecionados é inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const duration =
      selectedServices.reduce(
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

    /*
    =====================================================
    PROFISSIONAL
    =====================================================
    */

    const professional =
      await auth.db
        .collection("professionals")
        .findOne({
          _id:
            professionalObjectId,

          businessId,

          active: {
            $ne: false,
          },
        });

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
    HORÁRIOS CONFIGURADOS
    =====================================================
    */

    const schedule =
      await auth.db
        .collection("schedules")
        .findOne({
          professionalId:
            professionalObjectId,

          businessId,
        });

    if (
      !schedule ||
      !schedule.weekly
    ) {
      return NextResponse.json({
        ok: true,
        date,
        serviceId,
        professionalId,
        duration,
        slots: [],
        message:
          "Profissional sem horários configurados",
      });
    }

    const weekly =
      schedule.weekly as WeeklySchedule;

    const blocks: ScheduleBlock[] =
      Array.isArray(
        schedule.blocks
      )
        ? schedule.blocks
        : [];

    /*
    =====================================================
    DIA DA SEMANA
    =====================================================
    */

    const dateObject =
      createUTCDate(date);

    const weekDayKey =
      weekKeys[
        dateObject.getUTCDay()
      ];

    const day =
      weekly[weekDayKey];

    if (
      !day ||
      day.enabled !== true
    ) {
      return NextResponse.json({
        ok: true,
        date,
        serviceId,
        professionalId,
        duration,
        slots: [],
        message:
          "Profissional não atende nesta data",
      });
    }

    /*
    =====================================================
    BLOQUEIO DO DIA INTEIRO
    =====================================================
    */

    const allDayBlocked =
      blocks.some(
        (block) =>
          block.date === date &&
          block.allDay === true
      );

    if (allDayBlocked) {
      return NextResponse.json({
        ok: true,
        date,
        serviceId,
        professionalId,
        duration,
        slots: [],
        message:
          "Profissional indisponível nesta data",
      });
    }

    /*
    =====================================================
    AGENDAMENTOS JÁ EXISTENTES
    =====================================================
    */

    const appointments =
      await auth.db
        .collection("appointments")
        .find({
          businessId,

          professionalId:
            professionalObjectId,

          date,

          status: {
            $nin: [
              "cancelado",
              "faltou",
            ],
          },
        })
        .toArray();

    /*
    =====================================================
    GERAR HORÁRIOS
    =====================================================
    */

    const startOfDay =
      timeToMinutes(
        day.start
      );

    const endOfDay =
      timeToMinutes(
        day.end
      );

    if (
      startOfDay === null ||
      endOfDay === null
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Horário de expediente inválido",
        },
        {
          status: 500,
        }
      );
    }

    const slotInterval = 15;

    const slots: Array<{
      time: string;
      endTime: string;
    }> = [];

    for (
      let start =
        startOfDay;
      start + duration <=
      endOfDay;
      start += slotInterval
    ) {
      const end =
        start + duration;

      /*
      INTERVALO
      */

      if (
        day.breakEnabled ===
        true
      ) {
        const breakStart =
          timeToMinutes(
            day.breakStart
          );

        const breakEnd =
          timeToMinutes(
            day.breakEnd
          );

        if (
          breakStart !== null &&
          breakEnd !== null &&
          overlaps(
            start,
            end,
            breakStart,
            breakEnd
          )
        ) {
          continue;
        }
      }

      /*
      BLOQUEIOS ESPECÍFICOS
      */

      const blocked =
        blocks.some(
          (block) => {
            if (
              block.date !==
              date
            ) {
              return false;
            }

            if (
              block.allDay ===
              true
            ) {
              return true;
            }

            const blockStart =
              timeToMinutes(
                block.start ||
                  ""
              );

            const blockEnd =
              timeToMinutes(
                block.end ||
                  ""
              );

            if (
              blockStart ===
                null ||
              blockEnd ===
                null
            ) {
              return false;
            }

            return overlaps(
              start,
              end,
              blockStart,
              blockEnd
            );
          }
        );

      if (blocked) {
        continue;
      }

      /*
      AGENDAMENTOS OCUPADOS
      */

      const occupied =
        appointments.some(
          (
            appointment
          ) => {
            const appointmentStart =
              getAppointmentStartMinutes(
                appointment
              );

            if (
              appointmentStart ===
              null
            ) {
              return false;
            }

            const appointmentEnd =
              getAppointmentEndMinutes(
                appointment,
                appointmentStart
              );

            return overlaps(
              start,
              end,
              appointmentStart,
              appointmentEnd
            );
          }
        );

      if (occupied) {
        continue;
      }

      /*
      HORÁRIOS QUE JÁ PASSARAM HOJE
      */

      if (
        date ===
        todaySaoPaulo()
      ) {
        const nowMinutes =
          currentMinutesSaoPaulo();

        if (
          start <=
          nowMinutes
        ) {
          continue;
        }
      }

      slots.push({
        time:
          minutesToTime(
            start
          ),

        endTime:
          minutesToTime(
            end
          ),
      });
    }

    return NextResponse.json({
      ok: true,

      date,

      service: {
        _id:
          serviceObjectId.toString(),

        name:
          String(
            service.name || ""
          ),

        duration,

        price:
          Number(
            service.price || 0
          ),
      },

      professional: {
        _id:
          professionalObjectId.toString(),

        name:
          String(
            professional.name ||
              ""
          ),
      },

      slots,
    });
  } catch (error) {
    console.error(
      "GET DASHBOARD AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro interno ao calcular disponibilidade",
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

function createUTCDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12
    )
  );
}

function isValidDateString(
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

  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
}

function getAppointmentStartMinutes(
  appointment: any
) {
  const value =
    String(
      appointment.startTime ||
        appointment.time ||
        ""
    );

  return timeToMinutes(
    value
  );
}

function getAppointmentEndMinutes(
  appointment: any,
  appointmentStart: number
) {
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

  const duration =
    Number(
      appointment.duration ||
        appointment.serviceDuration ||
        30
    );

  return (
    appointmentStart +
    duration
  );
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

function currentMinutesSaoPaulo() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const hour =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "hour"
      )?.value || 0
    );

  const minute =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "minute"
      )?.value || 0
    );

  return (
    hour * 60 +
    minute
  );
}