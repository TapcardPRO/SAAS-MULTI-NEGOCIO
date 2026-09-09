type LiveQueueOptions = {
  date?: string;
  minimumNoticeMinutes?: number;
};

export function applyLiveQueue(
  sourceAppointments: any[],
  options: LiveQueueOptions = {}
) {
  const minimumNoticeMinutes =
    Math.max(
      1,
      Number(
        options.minimumNoticeMinutes ||
          5
      )
    );

  const appointments =
    sourceAppointments.map(
      (appointment) => ({
        ...appointment,
      })
    );

  const groups =
    new Map<
      string,
      any[]
    >();

  for (
    const appointment
    of appointments
  ) {
    const key =
      String(
        appointment.professionalId ||
          "sem-profissional"
      );

    const current =
      groups.get(key) ||
      [];

    current.push(
      appointment
    );

    groups.set(
      key,
      current
    );
  }

  const today =
    todaySaoPaulo();

  const nowMinutes =
    currentMinutesSaoPaulo();

  for (
    const group of
    groups.values()
  ) {
    group.sort(
      (a, b) =>
        getScheduledStart(a) -
        getScheduledStart(b)
    );

    let cursor:
      number | null =
      null;

    let previousScheduledEnd:
      number | null =
      null;

    let previousHadRuntime =
      false;

    for (
      const appointment
      of group
    ) {
      const status =
        normalizeStatus(
          appointment.status
        );

      const scheduledStart =
        getScheduledStart(
          appointment
        );

      const duration =
        appointmentDurationMinutes(
          appointment
        );

      const scheduledEnd =
        scheduledStart +
        duration;

      appointment.scheduledStartMinutes =
        scheduledStart;

      appointment.scheduledEndMinutes =
        scheduledEnd;

      appointment.scheduledStartTime =
        minutesToTime(
          scheduledStart
        );

      appointment.scheduledEndTime =
        minutesToTime(
          scheduledEnd
        );

      appointment.liveNoticeType =
        null;

      appointment.liveOffsetMinutes =
        0;

      appointment.liveNoticeMinutes =
        0;

      appointment.liveAvailableFromMinutes =
        null;

      appointment.liveAvailableFromTime =
        null;

      if (
        status ===
          "cancelado" ||
        status ===
          "faltou"
      ) {
        continue;
      }

      const actualStart =
        getStoredMinutes(
          appointment.actualStartMinutes,
          appointment.actualStartTime
        );

      const actualEnd =
        getStoredMinutes(
          appointment.actualEndMinutes,
          appointment.actualEndTime
        );

      const arrived =
        getStoredMinutes(
          appointment.arrivedMinutes,
          appointment.arrivedTime
        );

      const hadRuntime =
        actualStart !==
          null ||
        actualEnd !==
          null ||
        arrived !==
          null;

      /*
      ====================================================
      ATENDIMENTO JÁ CONCLUÍDO
      ====================================================
      */

      if (
        status ===
        "concluido"
      ) {
        const liveStart =
          actualStart ??
          scheduledStart;

        const liveEnd =
          actualEnd ??
          (
            liveStart +
            duration
          );

        appointment.liveEstimatedStartMinutes =
          liveStart;

        appointment.liveEstimatedEndMinutes =
          liveEnd;

        appointment.liveEstimatedStartTime =
          minutesToTime(
            liveStart
          );

        appointment.liveEstimatedEndTime =
          minutesToTime(
            liveEnd
          );

        cursor =
          liveEnd;

        previousScheduledEnd =
          scheduledEnd;

        previousHadRuntime =
          hadRuntime;

        continue;
      }

      /*
      ====================================================
      INÍCIO PREVISTO
      ====================================================
      */

      let liveStart =
        scheduledStart;

      if (
        actualStart !==
        null
      ) {
        liveStart =
          actualStart;
      } else if (
        arrived !==
        null
      ) {
        liveStart =
          Math.max(
            scheduledStart,
            arrived,
            cursor ??
              scheduledStart
          );
      } else if (
        cursor !==
        null &&
        cursor >
          scheduledStart
      ) {
        liveStart =
          cursor;
      }

      /*
      ====================================================
      ANTECIPAÇÃO
      Não mudamos o horário oficial.

      Só oferecemos antecipação quando:
      - o atendimento anterior sofreu alteração real;
      - ele terminaria originalmente encostado neste;
      - ficou livre pelo menos 5 minutos antes.
      ====================================================
      */

      const notStarted =
        actualStart ===
          null &&
        status !==
          "em_atendimento";

      if (
        notStarted &&
        cursor !==
          null &&
        previousHadRuntime &&
        previousScheduledEnd !==
          null &&
        previousScheduledEnd >=
          scheduledStart &&
        cursor <=
          scheduledStart -
            minimumNoticeMinutes
      ) {
        const advance =
          scheduledStart -
          cursor;

        appointment.liveNoticeType =
          "advance";

        appointment.liveOffsetMinutes =
          -advance;

        appointment.liveNoticeMinutes =
          advance;

        appointment.liveAvailableFromMinutes =
          cursor;

        appointment.liveAvailableFromTime =
          minutesToTime(
            cursor
          );
      }

      /*
      ====================================================
      ATRASO
      ====================================================
      */

      if (
        notStarted &&
        liveStart >=
          scheduledStart +
            minimumNoticeMinutes
      ) {
        const delay =
          liveStart -
          scheduledStart;

        appointment.liveNoticeType =
          "delay";

        appointment.liveOffsetMinutes =
          delay;

        appointment.liveNoticeMinutes =
          delay;
      }

      /*
      ====================================================
      TÉRMINO PREVISTO
      ====================================================
      */

      let liveEnd =
        liveStart +
        duration;

      /*
      Se já estiver em atendimento e ultrapassar
      a previsão original, não fingimos que acabou.
      */
      if (
        status ===
          "em_atendimento" &&
        String(
          appointment.date ||
            ""
        ) === today
      ) {
        liveEnd =
          Math.max(
            liveEnd,
            nowMinutes
          );
      }

      appointment.liveEstimatedStartMinutes =
        liveStart;

      appointment.liveEstimatedEndMinutes =
        liveEnd;

      appointment.liveEstimatedStartTime =
        minutesToTime(
          liveStart
        );

      appointment.liveEstimatedEndTime =
        minutesToTime(
          liveEnd
        );

      cursor =
        liveEnd;

      previousScheduledEnd =
        scheduledEnd;

      previousHadRuntime =
        hadRuntime ||
        status ===
          "em_atendimento";
    }
  }

  return appointments;
}

export function appointmentDurationMinutes(
  appointment: any
) {
  const direct =
    Number(
      appointment.duration ||
        appointment.serviceDuration ||
        0
    );

  if (
    Number.isFinite(
      direct
    ) &&
    direct > 0
  ) {
    return Math.max(
      5,
      direct
    );
  }

  if (
    Array.isArray(
      appointment.services
    ) &&
    appointment.services.length >
      0
  ) {
    const total =
      appointment.services.reduce(
        (
          sum: number,
          service: any
        ) =>
          sum +
          Math.max(
            0,
            Number(
              service.duration ||
                0
            )
          ),
        0
      );

    if (
      total > 0
    ) {
      return total;
    }
  }

  const start =
    getScheduledStart(
      appointment
    );

  const storedEnd =
    getStoredMinutes(
      appointment.endMinutes,
      appointment.endTime
    );

  if (
    storedEnd !==
      null &&
    storedEnd >
      start
  ) {
    return (
      storedEnd -
      start
    );
  }

  return 30;
}

export function currentMinutesSaoPaulo() {
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
    ) %
    24;

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

export function currentTimeSaoPaulo() {
  return minutesToTime(
    currentMinutesSaoPaulo()
  );
}

export function minutesToTime(
  value: number
) {
  const normalized =
    Math.max(
      0,
      Math.min(
        24 *
          60 -
          1,
        Math.round(
          value
        )
      )
    );

  const hour =
    Math.floor(
      normalized /
        60
    );

  const minute =
    normalized %
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

export function timeToMinutes(
  value: string
): number | null {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      String(
        value ||
          ""
      )
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

function getScheduledStart(
  appointment: any
) {
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

  return (
    timeToMinutes(
      String(
        appointment.startTime ||
          appointment.time ||
          "00:00"
      )
    ) ??
    0
  );
}

function getStoredMinutes(
  minutesValue: unknown,
  timeValue: unknown
): number | null {
  if (
    minutesValue !==
      null &&
    minutesValue !==
      undefined &&
    minutesValue !==
      ""
  ) {
    const value =
      Number(
        minutesValue
      );

    if (
      Number.isFinite(
        value
      )
    ) {
      return value;
    }
  }

  return timeToMinutes(
    String(
      timeValue ||
        ""
    )
  );
}

function normalizeStatus(
  value: unknown
) {
  const status =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  switch (
    status
  ) {
    case "pending":
      return "pendente";

    case "confirmed":
      return "confirmado";

    case "completed":
      return "concluido";

    case "cancelled":
      return "cancelado";

    default:
      return (
        status ||
        "pendente"
      );
  }
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
