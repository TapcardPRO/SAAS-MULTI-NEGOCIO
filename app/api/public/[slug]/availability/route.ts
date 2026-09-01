import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

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
  request: NextRequest,
  { params }: Props
) {
  try {
    const { slug } = await params;

    const url = new URL(
      request.url
    );

    const serviceId = String(
      url.searchParams.get("serviceId") || ""
    ).trim();

    const professionalId = String(
      url.searchParams.get("professionalId") || ""
    ).trim();

    const date = String(
      url.searchParams.get("date") || ""
    ).trim();

    /*
    =====================================================
    VALIDAÇÕES
    =====================================================
    */

    if (!slug) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa não informada",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !serviceId ||
      !ObjectId.isValid(serviceId)
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
          message:
            "Selecione um profissional",
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

    const db = await getDb();

    /*
    =====================================================
    EMPRESA
    =====================================================
    */

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
            "Empresa não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const businessId =
      business._id;

    const businessFilters: any[] = [
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
          businessFilters,
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

    const duration =
      Number(
        service.duration || 30
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

    const professionalObjectId =
      new ObjectId(
        professionalId
      );

    const professional = await db
      .collection("professionals")
      .findOne({
        _id:
          professionalObjectId,

        active: {
          $ne: false,
        },

        $or:
          businessFilters,
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

    /*
    =====================================================
    HORÁRIOS CONFIGURADOS
    =====================================================
    */

    const schedule =
      await db
        .collection("schedules")
        .findOne({
          $and: [
            {
              $or: [
                {
                  professionalId:
                    professionalObjectId,
                },
                {
                  professionalId:
                    professionalObjectId.toString(),
                },
              ],
            },

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
          ],
        } as any);

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
    AGENDAMENTOS EXISTENTES
    =====================================================
    */

    const appointments =
      await db
        .collection(
          "appointments"
        )
        .find({
          date,

          $and: [
            {
              $or: [
                {
                  professionalId:
                    professionalObjectId,
                },
                {
                  professionalId:
                    professionalObjectId.toString(),
                },
              ],
            },

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
          ],

          status: {
            $nin: [
              "cancelado",
              "cancelled",
              "faltou",
            ],
          },
        } as any)
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

    const slotInterval =
      15;

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
      ===================================================
      INTERVALO
      ===================================================
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
      ===================================================
      BLOQUEIOS
      ===================================================
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
                block.start || ""
              );

            const blockEnd =
              timeToMinutes(
                block.end || ""
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
      ===================================================
      HORÁRIOS OCUPADOS
      ===================================================
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
      ===================================================
      HORÁRIOS QUE JÁ PASSARAM
      ===================================================
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

    /*
    =====================================================
    RETORNO
    =====================================================
    */

    return NextResponse.json({
      ok: true,

      business: {
        _id:
          businessId.toString(),

        name:
          String(
            business.name || ""
          ),

        slug:
          String(
            business.slug || ""
          ),
      },

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
            professional.name || ""
          ),
      },

      date,

      slots,
    });
  } catch (error) {
    console.error(
      "GET PUBLIC AVAILABILITY ERROR:",
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

function getAppointmentEndMinutes(
  appointment: any,
  appointmentStart: number
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
    appointmentStart +
    Number(
      appointment.duration ||
        appointment.serviceDuration ||
        30
    )
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