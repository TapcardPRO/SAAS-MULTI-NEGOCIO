import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import {
  getDb,
} from "@/lib/db";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

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

const weekKeys = [
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
    const { slug } =
      await params;

    const url =
      new URL(
        request.url
      );

    const rawServiceIds =
      String(
        url.searchParams.get(
          "serviceIds"
        ) ||
        url.searchParams.get(
          "serviceId"
        ) ||
        ""
      );

    const serviceIds =
      rawServiceIds
        .split(",")
        .map(
          (value) =>
            value.trim()
        )
        .filter(Boolean);

    const professionalId =
      String(
        url.searchParams.get(
          "professionalId"
        ) || ""
      ).trim();

    const date =
      String(
        url.searchParams.get(
          "date"
        ) || ""
      ).trim();

    if (
      serviceIds.length === 0 ||
      serviceIds.some(
        (id) =>
          !ObjectId.isValid(
            id
          )
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Selecione pelo menos um serviço.",
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
            "Selecione um profissional.",
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

    const db =
      await getDb();

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

    const tenant = [
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

    const serviceObjectIds =
      serviceIds.map(
        (id) =>
          new ObjectId(
            id
          )
      );

    const services =
      await db
        .collection(
          "services"
        )
        .find({
          _id: {
            $in:
              serviceObjectIds,
          },

          active: {
            $ne: false,
          },

          $or:
            tenant,
        } as any)
        .toArray();

    if (
      services.length !==
      serviceIds.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Um dos serviços selecionados não está disponível.",
        },
        {
          status: 404,
        }
      );
    }

    /*
    Mantém a mesma ordem escolhida pelo cliente.
    */
    const orderedServices =
      serviceIds.map(
        (id) =>
          services.find(
            (service) =>
              String(
                service._id
              ) === id
          )
      ).filter(Boolean) as any[];

    const totalDuration =
      orderedServices.reduce(
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
      orderedServices.reduce(
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

    const professionalObjectId =
      new ObjectId(
        professionalId
      );

    const professional =
      await db
        .collection(
          "professionals"
        )
        .findOne({
          _id:
            professionalObjectId,

          active: {
            $ne: false,
          },

          $or:
            tenant,
        } as any);

    if (!professional) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Profissional não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const schedule =
      await db
        .collection(
          "schedules"
        )
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
                    professionalId,
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
      !schedule?.weekly
    ) {
      return NextResponse.json({
        ok: true,
        slots: [],
        totalDuration,
        totalPrice,
        message:
          "Profissional sem horários configurados.",
      });
    }

    const dateObject =
      createUTCDate(
        date
      );

    const key =
      weekKeys[
        dateObject.getUTCDay()
      ];

    const day =
      schedule.weekly[
        key
      ] as
        | DaySchedule
        | undefined;

    if (
      !day ||
      day.enabled !== true
    ) {
      return NextResponse.json({
        ok: true,
        slots: [],
        totalDuration,
        totalPrice,
        message:
          "Profissional não atende nesta data.",
      });
    }

    const blocks =
      Array.isArray(
        schedule.blocks
      )
        ? schedule.blocks
        : [];

    if (
      blocks.some(
        (block: any) =>
          block.date ===
            date &&
          block.allDay ===
            true
      )
    ) {
      return NextResponse.json({
        ok: true,
        slots: [],
        totalDuration,
        totalPrice,
        message:
          "Profissional indisponível nesta data.",
      });
    }

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
                    professionalId,
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

          /*
          Pendente e confirmado bloqueiam o horário.
          Só cancelado/faltou liberam.
          */
          status: {
            $nin: [
              "cancelado",
              "cancelled",
              "faltou",
            ],
          },
        } as any)
        .toArray();

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
            "Horário de expediente inválido.",
        },
        {
          status: 500,
        }
      );
    }

    const slots: {
      time: string;
      endTime: string;
    }[] = [];

    /*
    Mantemos grade de 15 minutos,
    mas a duração real pode ser 30, 40, 70, 90...
    */
    for (
      let start =
        startOfDay;

      start +
        totalDuration <=
      endOfDay;

      start += 15
    ) {
      const end =
        start +
        totalDuration;

      if (
        day.breakEnabled
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
          breakStart !==
            null &&
          breakEnd !==
            null &&
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

      const blocked =
        blocks.some(
          (block: any) => {
            if (
              block.date !==
              date
            ) {
              return false;
            }

            if (
              block.allDay
            ) {
              return true;
            }

            const blockStart =
              timeToMinutes(
                String(
                  block.start ||
                    ""
                )
              );

            const blockEnd =
              timeToMinutes(
                String(
                  block.end ||
                    ""
                )
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

      const occupied =
        appointments.some(
          (
            appointment
          ) => {
            const appointmentStart =
              getAppointmentStart(
                appointment
              );

            if (
              appointmentStart ===
              null
            ) {
              return false;
            }

            const appointmentEnd =
              getAppointmentEnd(
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

      if (
        date ===
        todaySaoPaulo()
      ) {
        if (
          start <=
          currentMinutesSaoPaulo()
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

      serviceIds,

      services:
        orderedServices.map(
          (service) => ({
            id:
              String(
                service._id
              ),

            name:
              String(
                service.name ||
                  ""
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

      totalDuration,

      totalPrice,

      professional: {
        id:
          professionalId,

        name:
          String(
            professional.name ||
              ""
          ),
      },

      date,

      slots,
    });
  } catch (error) {
    console.error(
      "PUBLIC MULTI AVAILABILITY ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao calcular disponibilidade.",
      },
      {
        status: 500,
      }
    );
  }
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
    startA <
      endB &&
    endA >
      startB
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
  return `${String(
    Math.floor(
      value / 60
    )
  ).padStart(
    2,
    "0"
  )}:${String(
    value % 60
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

function isValidDate(
  value: string
) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    value
  );
}

function todaySaoPaulo() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date()
  );
}

function currentMinutesSaoPaulo() {
  const parts =
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
    ).formatToParts(
      new Date()
    );

  const hour =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "hour"
      )?.value ||
        0
    );

  const minute =
    Number(
      parts.find(
        (part) =>
          part.type ===
          "minute"
      )?.value ||
        0
    );

  return (
    hour * 60 +
    minute
  );
}
