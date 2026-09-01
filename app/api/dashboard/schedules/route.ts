import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
  _id?: string;
  date: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  reason?: string;
};

function defaultDay(
  enabled = true
): DaySchedule {
  return {
    enabled,
    start: "09:00",
    end: "18:00",
    breakEnabled: true,
    breakStart: "12:00",
    breakEnd: "13:00",
  };
}

function defaultWeekly(): WeeklySchedule {
  return {
    monday: defaultDay(),
    tuesday: defaultDay(),
    wednesday: defaultDay(),
    thursday: defaultDay(),
    friday: defaultDay(),

    saturday: {
      ...defaultDay(),
      end: "14:00",
      breakEnabled: false,
    },

    sunday: defaultDay(false),
  };
}

async function getAuthenticatedBusiness() {
  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "saas_session"
    )?.value;

  if (!token) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Usuário não autenticado",
          },
          {
            status: 401,
          }
        ),
    };
  }

  const session =
    await verifySessionToken(
      token
    );

  if (
    !session?.userId ||
    !ObjectId.isValid(
      session.userId
    )
  ) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Sessão inválida",
          },
          {
            status: 401,
          }
        ),
    };
  }

  const db =
    await getDb();

  const user =
    await db
      .collection("users")
      .findOne({
        _id: new ObjectId(
          session.userId
        ),
      });

  if (!user) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Usuário não encontrado",
          },
          {
            status: 404,
          }
        ),
    };
  }

  if (
    user.active === false
  ) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Usuário bloqueado",
          },
          {
            status: 403,
          }
        ),
    };
  }

  if (
    !user.businessId
  ) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Usuário sem empresa vinculada",
          },
          {
            status: 400,
          }
        ),
    };
  }

  const businessIdString =
    String(
      user.businessId
    );

  if (
    !ObjectId.isValid(
      businessIdString
    )
  ) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Empresa inválida",
          },
          {
            status: 400,
          }
        ),
    };
  }

  const businessId =
    new ObjectId(
      businessIdString
    );

  const business =
    await db
      .collection(
        "businesses"
      )
      .findOne({
        _id: businessId,
      });

  if (!business) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Empresa não encontrada",
          },
          {
            status: 404,
          }
        ),
    };
  }

  if (
    business.active === false
  ) {
    return {
      error:
        NextResponse.json(
          {
            message:
              "Empresa bloqueada",
          },
          {
            status: 403,
          }
        ),
    };
  }

  return {
    db,
    user,
    business,
    businessId,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if (
      "error" in auth
    ) {
      return auth.error;
    }

    const {
      db,
      businessId,
    } = auth;

    const url =
      new URL(
        request.url
      );

    const professionalId =
      url.searchParams.get(
        "professionalId"
      );

    if (
      !professionalId ||
      !ObjectId.isValid(
        professionalId
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

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

          $or: [
            {
              businessId,
            },

            {
              businessId:
                businessId.toString(),
            },
          ],
        });

    if (!professional) {
      return NextResponse.json(
        {
          message:
            "Profissional não encontrado",
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
          businessId,
          professionalId:
            professionalObjectId,
        });

    if (!schedule) {
      return NextResponse.json({
        schedule: {
          weekly:
            defaultWeekly(),

          blocks: [],
        },
      });
    }

    return NextResponse.json({
      schedule: {
        _id:
          schedule._id.toString(),

        professionalId:
          professionalId,

        weekly:
          schedule.weekly ||
          defaultWeekly(),

        blocks:
          Array.isArray(
            schedule.blocks
          )
            ? schedule.blocks
            : [],
      },
    });
  } catch (error) {
    console.error(
      "Erro em GET /api/dashboard/schedules:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar horários",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if (
      "error" in auth
    ) {
      return auth.error;
    }

    const {
      db,
      businessId,
    } = auth;

    const body =
      await request.json();

    const professionalId =
      String(
        body.professionalId ||
          ""
      );

    if (
      !professionalId ||
      !ObjectId.isValid(
        professionalId
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

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

          $or: [
            {
              businessId,
            },

            {
              businessId:
                businessId.toString(),
            },
          ],
        });

    if (!professional) {
      return NextResponse.json(
        {
          message:
            "Profissional não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const weekly =
      sanitizeWeekly(
        body.weekly
      );

    if (!weekly) {
      return NextResponse.json(
        {
          message:
            "Configuração semanal inválida",
        },
        {
          status: 400,
        }
      );
    }

    const blocks =
      sanitizeBlocks(
        body.blocks
      );

    const now =
      new Date();

    await db
      .collection(
        "schedules"
      )
      .updateOne(
        {
          businessId,
          professionalId:
            professionalObjectId,
        },

        {
          $set: {
            businessId,

            professionalId:
              professionalObjectId,

            weekly,

            blocks,

            updatedAt:
              now,
          },

          $setOnInsert: {
            createdAt:
              now,
          },
        },

        {
          upsert: true,
        }
      );

    return NextResponse.json({
      message:
        "Horários salvos com sucesso",

      schedule: {
        professionalId,
        weekly,
        blocks,
      },
    });
  } catch (error) {
    console.error(
      "Erro em PUT /api/dashboard/schedules:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao salvar horários",
      },
      {
        status: 500,
      }
    );
  }
}

function sanitizeWeekly(
  input: unknown
): WeeklySchedule | null {
  if (
    !input ||
    typeof input !==
      "object"
  ) {
    return null;
  }

  const raw =
    input as Record<
      string,
      unknown
    >;

  const keys: Array<
    keyof WeeklySchedule
  > = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const result =
    {} as WeeklySchedule;

  for (
    const key of keys
  ) {
    const day =
      raw[key];

    if (
      !day ||
      typeof day !==
        "object"
    ) {
      return null;
    }

    const item =
      day as Record<
        string,
        unknown
      >;

    const enabled =
      item.enabled === true;

    const start =
      normalizeTime(
        item.start
      );

    const end =
      normalizeTime(
        item.end
      );

    const breakEnabled =
      item.breakEnabled ===
      true;

    const breakStart =
      normalizeTime(
        item.breakStart
      );

    const breakEnd =
      normalizeTime(
        item.breakEnd
      );

    if (
      enabled &&
      (!start || !end)
    ) {
      return null;
    }

    if (
      enabled &&
      minutes(start) >=
        minutes(end)
    ) {
      return null;
    }

    if (
      enabled &&
      breakEnabled
    ) {
      if (
        !breakStart ||
        !breakEnd
      ) {
        return null;
      }

      if (
        minutes(
          breakStart
        ) >=
        minutes(
          breakEnd
        )
      ) {
        return null;
      }

      if (
        minutes(
          breakStart
        ) <
          minutes(start) ||
        minutes(
          breakEnd
        ) >
          minutes(end)
      ) {
        return null;
      }
    }

    result[key] = {
      enabled,

      start:
        start || "09:00",

      end:
        end || "18:00",

      breakEnabled,

      breakStart:
        breakStart ||
        "12:00",

      breakEnd:
        breakEnd ||
        "13:00",
    };
  }

  return result;
}

function sanitizeBlocks(
  input: unknown
): ScheduleBlock[] {
  if (
    !Array.isArray(
      input
    )
  ) {
    return [];
  }

  const result:
    ScheduleBlock[] = [];

  for (
    const item of input
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }

    const block =
      item as Record<
        string,
        unknown
      >;

    const date =
      String(
        block.date ||
          ""
      ).trim();

    if (
      !isValidDateString(
        date
      )
    ) {
      continue;
    }

    const allDay =
      block.allDay ===
      true;

    const reason =
      String(
        block.reason ||
          ""
      )
        .trim()
        .slice(0, 250);

    if (allDay) {
      result.push({
        _id:
          typeof block._id ===
          "string"
            ? block._id
            : undefined,

        date,

        allDay: true,

        reason,
      });

      continue;
    }

    const start =
      normalizeTime(
        block.start
      );

    const end =
      normalizeTime(
        block.end
      );

    if (
      !start ||
      !end
    ) {
      continue;
    }

    if (
      minutes(start) >=
      minutes(end)
    ) {
      continue;
    }

    result.push({
      _id:
        typeof block._id ===
        "string"
          ? block._id
          : undefined,

      date,

      start,

      end,

      allDay: false,

      reason,
    });
  }

  return result;
}

function normalizeTime(
  value: unknown
) {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  const time =
    value.trim();

  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      time
    )
  ) {
    return "";
  }

  return time;
}

function minutes(
  value: string
) {
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
        day
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