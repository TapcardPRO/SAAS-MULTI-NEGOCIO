import {
  Db,
  ObjectId,
} from "mongodb";

import {
  randomUUID,
} from "node:crypto";

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

export type PublicAvailabilityResult = {
  ok: boolean;
  status: number;
  message?: string;

  business?: any;
  professional?: any;
  services?: any[];

  totalDuration?: number;
  totalPrice?: number;

  slots?: {
    time: string;
    endTime: string;
  }[];
};

export async function getPublicBookingAvailability(
  db: Db,
  args: {
    slug: string;
    serviceIds: string[];
    professionalId: string;
    date: string;
  }
): Promise<PublicAvailabilityResult> {
  const {
    slug,
    serviceIds,
    professionalId,
    date,
  } = args;

  /*
  =======================================================
  VALIDAÇÕES
  =======================================================
  */

  if (
    serviceIds.length === 0 ||
    serviceIds.some(
      (id) =>
        !ObjectId.isValid(id)
    )
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Selecione pelo menos um serviço válido.",
    };
  }

  /*
  Impede que alguém envie o mesmo serviço várias vezes
  manualmente para manipular duração/preço.
  */
  if (
    new Set(serviceIds).size !==
    serviceIds.length
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Existem serviços duplicados na seleção.",
    };
  }

  if (
    !ObjectId.isValid(
      professionalId
    )
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Selecione um profissional válido.",
    };
  }

  if (
    !isValidDate(date)
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Data inválida.",
    };
  }

  if (
    date <
    todaySaoPaulo()
  ) {
    return {
      ok: true,
      status: 200,
      slots: [],
      totalDuration: 0,
      totalPrice: 0,
      message:
        "Não é possível agendar uma data que já passou.",
    };
  }

  /*
  =======================================================
  EMPRESA
  =======================================================
  */

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
    return {
      ok: false,
      status: 404,
      message:
        "Empresa não encontrada.",
    };
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

  /*
  =======================================================
  SERVIÇOS
  =======================================================
  */

  const serviceObjectIds =
    serviceIds.map(
      (id) =>
        new ObjectId(id)
    );

  const foundServices =
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
    foundServices.length !==
    serviceIds.length
  ) {
    return {
      ok: false,
      status: 404,
      message:
        "Um dos serviços selecionados não está disponível.",
    };
  }

  const services =
    serviceIds
      .map(
        (id) =>
          foundServices.find(
            (service) =>
              String(
                service._id
              ) === id
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
        const raw =
          Number(
            service.duration ||
              30
          );

        const duration =
          Number.isFinite(
            raw
          ) &&
          raw > 0
            ? Math.max(
                5,
                raw
              )
            : 30;

        return (
          total +
          duration
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

  if (
    totalDuration <= 0 ||
    totalDuration >
      24 * 60
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "A duração dos serviços selecionados é inválida.",
    };
  }

  /*
  =======================================================
  PROFISSIONAL
  =======================================================
  */

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
    return {
      ok: false,
      status: 404,
      message:
        "Profissional não encontrado.",
    };
  }

  /*
  Se serviceIds não estiver configurado no profissional,
  mantemos compatibilidade: ele atende todos.

  Se estiver configurado, ele precisa executar TODOS
  os serviços escolhidos pelo cliente.
  */

  if (
    Array.isArray(
      professional.serviceIds
    ) &&
    professional.serviceIds.length >
      0
  ) {
    const professionalServices =
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
        (id) =>
          professionalServices.has(
            id
          )
      );

    if (!canPerformAll) {
      return {
        ok: false,
        status: 409,
        message:
          "Este profissional não realiza todos os serviços selecionados.",
      };
    }
  }

  /*
  =======================================================
  ESCALA
  =======================================================
  */

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
    return {
      ok: true,
      status: 200,
      business,
      professional,
      services,
      totalDuration,
      totalPrice,
      slots: [],
      message:
        "Profissional sem horários configurados.",
    };
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
    return {
      ok: true,
      status: 200,
      business,
      professional,
      services,
      totalDuration,
      totalPrice,
      slots: [],
      message:
        "Profissional não atende nesta data.",
    };
  }

  const startOfDay =
    timeToMinutes(
      String(
        day.start ||
          ""
      )
    );

  const endOfDay =
    timeToMinutes(
      String(
        day.end ||
          ""
      )
    );

  if (
    startOfDay === null ||
    endOfDay === null ||
    endOfDay <=
      startOfDay
  ) {
    return {
      ok: false,
      status: 500,
      message:
        "Horário de expediente inválido.",
    };
  }

  /*
  =======================================================
  BLOQUEIOS
  =======================================================
  */

  const blocks =
    Array.isArray(
      schedule.blocks
    )
      ? schedule.blocks
      : [];

  const fullDayBlocked =
    blocks.some(
      (block: any) =>
        block.date ===
          date &&
        block.allDay ===
          true
    );

  if (fullDayBlocked) {
    return {
      ok: true,
      status: 200,
      business,
      professional,
      services,
      totalDuration,
      totalPrice,
      slots: [],
      message:
        "Profissional indisponível nesta data.",
    };
  }

  /*
  =======================================================
  AGENDAMENTOS EXISTENTES
  =======================================================
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
  =======================================================
  GERAR HORÁRIOS
  =======================================================
  */

  const slots: {
    time: string;
    endTime: string;
  }[] = [];

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

    /*
    Intervalo / almoço.
    */

    if (
      day.breakEnabled
    ) {
      const breakStart =
        timeToMinutes(
          String(
            day.breakStart ||
              ""
          )
        );

      const breakEnd =
        timeToMinutes(
          String(
            day.breakEnd ||
              ""
          )
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

    /*
    Bloqueios parciais.
    */

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

    /*
    Outros clientes/agendamentos.
    */

    const occupied =
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
            start,
            end,
            existingStart,
            existingEnd
          );
        }
      );

    if (occupied) {
      continue;
    }

    /*
    Não mostra horário que já passou.
    */

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

  return {
    ok: true,
    status: 200,

    business,
    professional,
    services,

    totalDuration,
    totalPrice,

    slots,
  };
}

/*
=========================================================
LOCK DE CONCORRÊNCIA
=========================================================

Dois clientes podem clicar "Confirmar" quase ao mesmo tempo.

Serializamos a confirmação por:
empresa + profissional + data.

Depois de adquirir o lock, a API recalcula a disponibilidade.
=========================================================
*/

export async function acquireBookingLock(
  db: Db,
  args: {
    businessId: ObjectId;
    professionalId: ObjectId;
    date: string;
  }
): Promise<
  | {
      id: string;
      owner: string;
    }
  | null
> {
  const id =
    `${args.businessId.toString()}:${args.professionalId.toString()}:${args.date}`;

  const owner =
    randomUUID();

  const collection =
    db.collection<any>(
      "booking_locks"
    );

  /*
  Garante que o documento existe.
  Em concorrência, um insert pode ganhar do outro.
  O erro 11000 é esperado e seguro.
  */
  try {
    await collection.updateOne(
      {
        _id:
          id,
      },
      {
        $setOnInsert: {
          lockedUntil:
            new Date(0),

          owner:
            "",

          createdAt:
            new Date(),
        },
      },
      {
        upsert:
          true,
      }
    );
  } catch (error: any) {
    if (
      Number(
        error?.code
      ) !== 11000
    ) {
      throw error;
    }
  }

  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {
    const now =
      new Date();

    const lockedUntil =
      new Date(
        now.getTime() +
          10000
      );

    const result =
      await collection.updateOne(
        {
          _id:
            id,

          lockedUntil: {
            $lte:
              now,
          },
        },
        {
          $set: {
            owner,

            lockedUntil,

            updatedAt:
              now,
          },
        }
      );

    if (
      result.matchedCount ===
      1
    ) {
      return {
        id,
        owner,
      };
    }

    await sleep(
      75
    );
  }

  return null;
}

export async function releaseBookingLock(
  db: Db,
  lock: {
    id: string;
    owner: string;
  }
) {
  await db
    .collection<any>(
      "booking_locks"
    )
    .updateOne(
      {
        _id:
          lock.id,

        owner:
          lock.owner,
      },
      {
        $set: {
          owner:
            "",

          lockedUntil:
            new Date(0),

          updatedAt:
            new Date(),
        },
      }
    );
}

/*
=========================================================
HELPERS
=========================================================
*/

function getAppointmentStart(
  appointment: any
): number | null {
  const stored =
    Number(
      appointment.startMinutes
    );

  if (
    Number.isFinite(
      stored
    )
  ) {
    return stored;
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
  const stored =
    Number(
      appointment.endMinutes
    );

  if (
    Number.isFinite(
      stored
    )
  ) {
    return stored;
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
      ) &&
      duration > 0
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
  ] =
    value
      .split(":")
      .map(Number);

  return (
    hour *
      60 +
    minute
  );
}

function minutesToTime(
  value: number
) {
  const hour =
    Math.floor(
      value /
        60
    );

  const minute =
    value %
    60;

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

function createUTCDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value
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
    hour *
      60 +
    minute
  );
}

function sleep(
  milliseconds: number
) {
  return new Promise<void>(
    (resolve) => {
      setTimeout(
        resolve,
        milliseconds
      );
    }
  );
}
