import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export async function GET() {
  try {
    const auth =
      await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const filters =
      tenantFilters(
        auth.businessId,
        auth.business.slug
      );

    const plans =
      await auth.db
        .collection(
          "plans"
        )
        .find({
          $or:
            filters,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

    return NextResponse.json({
      plans:
        plans.map(
          (plan) =>
            serializePlan(
              plan
            )
        ),
    });
  } catch (error) {
    console.error(
      "GET PLANS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar planos",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const body =
      await request.json();

    const parsed =
      parsePlanBody(
        body
      );

    const validation =
      validatePlan(
        parsed
      );

    if (validation) {
      return NextResponse.json(
        {
          message:
            validation,
        },
        {
          status: 400,
        }
      );
    }

    const serviceIds =
      normalizeServiceIds(
        body.serviceIds
      );

    const serviceValidation =
      await validateServices(
        auth.db,
        auth.businessId,
        auth.business.slug,
        serviceIds
      );

    if (
      !serviceValidation.ok
    ) {
      return NextResponse.json(
        {
          message:
            serviceValidation.message,
        },
        {
          status: 400,
        }
      );
    }

    const now =
      new Date();

    const plan = {
      businessId:
        auth.businessId,

      businessSlug:
        auth.business.slug ||
        "",

      name:
        parsed.name,

      description:
        parsed.description,

      price:
        parsed.price,

      totalUses:
        parsed.totalUses,

      validityDays:
        parsed.validityDays,

      /*
      [] significa plano compatível
      com qualquer serviço.

      Lista preenchida significa
      que o plano cobre somente
      aqueles serviços.
      */
      serviceIds:
        serviceValidation.objectIds,

      active:
        parsed.active,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await auth.db
        .collection(
          "plans"
        )
        .insertOne(
          plan
        );

    return NextResponse.json(
      {
        message:
          "Plano cadastrado com sucesso",

        plan:
          serializePlan({
            ...plan,
            _id:
              result.insertedId,
          }),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST PLANS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao cadastrar plano",
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
      await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const body =
      await request.json();

    const id =
      String(
        body.id ||
          body._id ||
          body.planId ||
          ""
      ).trim();

    if (
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Plano inválido",
        },
        {
          status: 400,
        }
      );
    }

    const objectId =
      new ObjectId(
        id
      );

    const filters =
      tenantFilters(
        auth.businessId,
        auth.business.slug
      );

    const existing =
      await auth.db
        .collection(
          "plans"
        )
        .findOne({
          _id:
            objectId,

          $or:
            filters,
        });

    if (!existing) {
      return NextResponse.json(
        {
          message:
            "Plano não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const update: any = {
      updatedAt:
        new Date(),
    };

    if (
      body.name !==
      undefined
    ) {
      const name =
        String(
          body.name ||
            ""
        ).trim();

      if (!name) {
        return NextResponse.json(
          {
            message:
              "Informe o nome do plano",
          },
          {
            status: 400,
          }
        );
      }

      update.name =
        name;
    }

    if (
      body.description !==
      undefined
    ) {
      update.description =
        String(
          body.description ||
            ""
        ).trim();
    }

    if (
      body.price !==
      undefined
    ) {
      const price =
        parseMoney(
          body.price
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        return NextResponse.json(
          {
            message:
              "Informe um preço válido",
          },
          {
            status: 400,
          }
        );
      }

      update.price =
        price;
    }

    if (
      body.totalUses !==
      undefined
    ) {
      const totalUses =
        Number(
          body.totalUses
        );

      if (
        !Number.isInteger(
          totalUses
        ) ||
        totalUses <= 0
      ) {
        return NextResponse.json(
          {
            message:
              "Informe uma quantidade de usos válida",
          },
          {
            status: 400,
          }
        );
      }

      update.totalUses =
        totalUses;
    }

    if (
      body.validityDays !==
      undefined
    ) {
      const validityDays =
        Number(
          body.validityDays
        );

      if (
        !Number.isInteger(
          validityDays
        ) ||
        validityDays <= 0
      ) {
        return NextResponse.json(
          {
            message:
              "Informe uma validade válida",
          },
          {
            status: 400,
          }
        );
      }

      update.validityDays =
        validityDays;
    }

    if (
      body.active !==
      undefined
    ) {
      update.active =
        body.active !==
        false;
    }

    if (
      body.serviceIds !==
      undefined
    ) {
      const serviceIds =
        normalizeServiceIds(
          body.serviceIds
        );

      const validation =
        await validateServices(
          auth.db,
          auth.businessId,
          auth.business.slug,
          serviceIds
        );

      if (!validation.ok) {
        return NextResponse.json(
          {
            message:
              validation.message,
          },
          {
            status: 400,
          }
        );
      }

      update.serviceIds =
        validation.objectIds;
    }

    await auth.db
      .collection(
        "plans"
      )
      .updateOne(
        {
          _id:
            objectId,
        },
        {
          $set:
            update,
        }
      );

    const updated =
      await auth.db
        .collection(
          "plans"
        )
        .findOne({
          _id:
            objectId,
        });

    return NextResponse.json({
      message:
        "Plano atualizado com sucesso",

      plan:
        serializePlan(
          updated
        ),
    });
  } catch (error) {
    console.error(
      "PUT PLANS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao atualizar plano",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    const id =
      String(
        url.searchParams.get(
          "id"
        ) ||
          ""
      );

    if (
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Plano inválido",
        },
        {
          status: 400,
        }
      );
    }

    const objectId =
      new ObjectId(
        id
      );

    const filters =
      tenantFilters(
        auth.businessId,
        auth.business.slug
      );

    const existing =
      await auth.db
        .collection(
          "plans"
        )
        .findOne({
          _id:
            objectId,

          $or:
            filters,
        });

    if (!existing) {
      return NextResponse.json(
        {
          message:
            "Plano não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const membership =
      await auth.db
        .collection(
          "memberships"
        )
        .findOne({
          planId:
            objectId,

          active: {
            $ne: false,
          },

          $or:
            filters,
        } as any);

    if (membership) {
      return NextResponse.json(
        {
          message:
            "Este plano possui mensalistas ativos. Desative o plano em vez de excluir.",
        },
        {
          status: 409,
        }
      );
    }

    await auth.db
      .collection(
        "plans"
      )
      .deleteOne({
        _id:
          objectId,
      });

    return NextResponse.json({
      message:
        "Plano excluído com sucesso",
    });
  } catch (error) {
    console.error(
      "DELETE PLANS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao excluir plano",
      },
      {
        status: 500,
      }
    );
  }
}

function parsePlanBody(
  body: any
) {
  return {
    name:
      String(
        body.name ||
          ""
      ).trim(),

    description:
      String(
        body.description ||
          ""
      ).trim(),

    price:
      parseMoney(
        body.price
      ),

    totalUses:
      Number(
        body.totalUses
      ),

    validityDays:
      body.validityDays ===
      undefined
        ? 30
        : Number(
            body.validityDays
          ),

    active:
      body.active ===
      undefined
        ? true
        : body.active !==
          false,
  };
}

function validatePlan(
  plan: ReturnType<
    typeof parsePlanBody
  >
) {
  if (!plan.name) {
    return "Informe o nome do plano";
  }

  if (
    !Number.isFinite(
      plan.price
    ) ||
    plan.price < 0
  ) {
    return "Informe um preço válido";
  }

  if (
    !Number.isInteger(
      plan.totalUses
    ) ||
    plan.totalUses <= 0
  ) {
    return "Informe uma quantidade de usos válida";
  }

  if (
    !Number.isInteger(
      plan.validityDays
    ) ||
    plan.validityDays <= 0
  ) {
    return "Informe uma validade válida";
  }

  return "";
}

function normalizeServiceIds(
  value: unknown
) {
  const items =
    Array.isArray(
      value
    )
      ? value
      : [];

  return Array.from(
    new Set(
      items
        .map(
          (item) =>
            String(
              item ||
                ""
            ).trim()
        )
        .filter(
          Boolean
        )
    )
  );
}

async function validateServices(
  db: any,
  businessId: any,
  slug: string,
  serviceIds: string[]
) {
  if (
    serviceIds.some(
      (id) =>
        !ObjectId.isValid(
          id
        )
    )
  ) {
    return {
      ok: false,
      message:
        "Um dos serviços selecionados é inválido.",
      objectIds:
        [],
    };
  }

  if (
    serviceIds.length ===
    0
  ) {
    return {
      ok: true,
      message: "",
      objectIds:
        [],
    };
  }

  const objectIds =
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
            objectIds,
        },

        active: {
          $ne: false,
        },

        $or:
          tenantFilters(
            businessId,
            slug
          ),
      } as any)
      .toArray();

  if (
    services.length !==
    serviceIds.length
  ) {
    return {
      ok: false,
      message:
        "Um dos serviços selecionados não pertence à empresa ou está inativo.",
      objectIds:
        [],
    };
  }

  return {
    ok: true,
    message: "",
    objectIds,
  };
}

function tenantFilters(
  businessId: any,
  slug?: string
) {
  return [
    {
      businessId,
    },

    {
      businessId:
        String(
          businessId
        ),
    },

    ...(slug
      ? [
          {
            businessSlug:
              slug,
          },
        ]
      : []),
  ];
}

function serializePlan(
  plan: any
) {
  if (!plan) {
    return null;
  }

  return {
    _id:
      String(
        plan._id
      ),

    name:
      String(
        plan.name ||
          ""
      ),

    description:
      String(
        plan.description ||
          ""
      ),

    price:
      Number(
        plan.price ||
          0
      ),

    totalUses:
      Number(
        plan.totalUses ||
          0
      ),

    validityDays:
      Number(
        plan.validityDays ||
          30
      ),

    serviceIds:
      Array.isArray(
        plan.serviceIds
      )
        ? plan.serviceIds.map(
            String
          )
        : [],

    active:
      plan.active !==
      false,

    createdAt:
      plan.createdAt ||
      null,

    updatedAt:
      plan.updatedAt ||
      null,
  };
}

function parseMoney(
  value: unknown
) {
  if (
    typeof value ===
    "number"
  ) {
    return value;
  }

  const text =
    String(
      value ??
        ""
    )
      .trim()
      .replace(
        /\s/g,
        ""
      )
      .replace(
        "R$",
        ""
      );

  if (
    text.includes(
      ","
    )
  ) {
    return Number(
      text
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        )
    );
  }

  return Number(
    text
  );
}
