import {
  NextRequest,
  NextResponse,
} from "next/server";

import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

/*
=========================================================
AUTENTICAÇÃO + EMPRESA DA SESSÃO
=========================================================
*/

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
      String(
        session.userId
      )
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
        _id:
          new ObjectId(
            String(
              session.userId
            )
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

  if (!user.businessId) {
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
        _id:
          businessId,
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
    business.active ===
    false
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

/*
=========================================================
FILTRO DA EMPRESA
=========================================================
*/

function getTenantFilters(
  businessId: ObjectId,
  businessSlug?: string
) {
  const filters: any[] =
    [
      {
        businessId,
      },

      {
        businessId:
          businessId.toString(),
      },
    ];

  if (businessSlug) {
    filters.push({
      businessSlug,
    });
  }

  return filters;
}

/*
=========================================================
GET
LISTAR SERVIÇOS
=========================================================
*/

export async function GET() {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if ("error" in auth) {
      return auth.error;
    }

    const {
      db,
      business,
      businessId,
    } = auth;

    const services =
      await db
        .collection(
          "services"
        )
        .find({
          $or:
            getTenantFilters(
              businessId,
              business.slug
            ),
        })
        .sort({
          order: 1,
          name: 1,
          createdAt: 1,
        })
        .toArray();

    return NextResponse.json(
      {
        services:
          services.map(
            serializeService
          ),
      }
    );
  } catch (error) {
    console.error(
      "GET SERVICES ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar serviços",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
POST
CRIAR SERVIÇO
=========================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if ("error" in auth) {
      return auth.error;
    }

    if (
      auth.user.role ===
      "employee"
    ) {
      return NextResponse.json(
        {
          message:
            "Acesso exclusivo do proprietário",
        },
        {
          status: 403,
        }
      );
    }

    const {
      db,
      business,
      businessId,
    } = auth;

    let body: any =
      {};

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          message:
            "Dados do serviço inválidos",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "BODY NOVO SERVIÇO:",
      body
    );

    const name =
      String(
        body.name || ""
      ).trim();

    const description =
      String(
        body.description ||
          ""
      ).trim();

    const photoUrl =
      String(
        body.photoUrl ||
          ""
      ).trim();

    const price =
      parseNumber(
        body.price
      );

    const duration =
      parseInteger(
        body.duration
      );

    const active =
      body.active !==
      false;

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do serviço",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        price
      ) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Informe um valor válido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        duration
      ) ||
      duration <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Informe uma duração válida",
        },
        {
          status: 400,
        }
      );
    }

    const tenantFilters =
      getTenantFilters(
        businessId,
        business.slug
      );

    const lastService =
      await db
        .collection(
          "services"
        )
        .find({
          $or:
            tenantFilters,
        })
        .sort({
          order: -1,
        })
        .limit(1)
        .toArray();

    const nextOrder =
      lastService.length >
      0
        ? Number(
            lastService[0]
              .order || 0
          ) + 1
        : 1;

    const now =
      new Date();

    const service = {
      businessId,

      businessSlug:
        business.slug ||
        "",

      name,

      description,

      price,

      duration,

      photoUrl,

      active,

      order:
        nextOrder,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await db
        .collection(
          "services"
        )
        .insertOne(
          service
        );

    return NextResponse.json(
      {
        message:
          "Serviço criado com sucesso",

        service:
          serializeService(
            {
              ...service,

              _id:
                result.insertedId,
            }
          ),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST SERVICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao criar serviço",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
PUT
EDITAR / ATIVAR / DESATIVAR
=========================================================
*/

export async function PUT(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if ("error" in auth) {
      return auth.error;
    }

    if (
      auth.user.role ===
      "employee"
    ) {
      return NextResponse.json(
        {
          message:
            "Acesso exclusivo do proprietário",
        },
        {
          status: 403,
        }
      );
    }

    const {
      db,
      business,
      businessId,
    } = auth;

    let body: any =
      {};

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          message:
            "Dados inválidos",
        },
        {
          status: 400,
        }
      );
    }

    const id =
      String(
        body.id || ""
      ).trim();

    if (
      !id ||
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Serviço inválido",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await db
        .collection(
          "services"
        )
        .findOne({
          _id:
            new ObjectId(
              id
            ),

          $or:
            getTenantFilters(
              businessId,
              business.slug
            ),
        });

    if (!existing) {
      return NextResponse.json(
        {
          message:
            "Serviço não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const update: any =
      {
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
              "Informe o nome do serviço",
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
      body.photoUrl !==
      undefined
    ) {
      update.photoUrl =
        String(
          body.photoUrl ||
            ""
        ).trim();
    }

    if (
      body.price !==
      undefined
    ) {
      const price =
        parseNumber(
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
              "Informe um valor válido",
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
      body.duration !==
      undefined
    ) {
      const duration =
        parseInteger(
          body.duration
        );

      if (
        !Number.isInteger(
          duration
        ) ||
        duration <= 0
      ) {
        return NextResponse.json(
          {
            message:
              "Informe uma duração válida",
          },
          {
            status: 400,
          }
        );
      }

      update.duration =
        duration;
    }

    if (
      typeof body.active ===
      "boolean"
    ) {
      update.active =
        body.active;
    }

    if (
      body.order !==
      undefined
    ) {
      const order =
        parseInteger(
          body.order
        );

      if (
        Number.isInteger(
          order
        )
      ) {
        update.order =
          order;
      }
    }

    await db
      .collection(
        "services"
      )
      .updateOne(
        {
          _id:
            existing._id,
        },
        {
          $set:
            update,
        }
      );

    const updated =
      await db
        .collection(
          "services"
        )
        .findOne({
          _id:
            existing._id,
        });

    return NextResponse.json(
      {
        message:
          "Serviço atualizado com sucesso",

        service:
          updated
            ? serializeService(
                updated
              )
            : null,
      }
    );
  } catch (error) {
    console.error(
      "PUT SERVICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao atualizar serviço",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
DELETE
EXCLUIR SERVIÇO
=========================================================
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedBusiness();

    if ("error" in auth) {
      return auth.error;
    }

    if (
      auth.user.role ===
      "employee"
    ) {
      return NextResponse.json(
        {
          message:
            "Acesso exclusivo do proprietário",
        },
        {
          status: 403,
        }
      );
    }

    const {
      db,
      business,
      businessId,
    } = auth;

    const url =
      new URL(
        request.url
      );

    const id =
      String(
        url.searchParams.get(
          "id"
        ) || ""
      ).trim();

    if (
      !id ||
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Serviço inválido",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await db
        .collection(
          "services"
        )
        .findOne({
          _id:
            new ObjectId(
              id
            ),

          $or:
            getTenantFilters(
              businessId,
              business.slug
            ),
        });

    if (!existing) {
      return NextResponse.json(
        {
          message:
            "Serviço não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    await db
      .collection(
        "services"
      )
      .deleteOne({
        _id:
          existing._id,
      });

    return NextResponse.json(
      {
        message:
          "Serviço excluído com sucesso",
      }
    );
  } catch (error) {
    console.error(
      "DELETE SERVICE ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao excluir serviço",
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
  return new NextResponse(
    null,
    {
      status: 204,

      headers: {
        Allow:
          "GET, POST, PUT, DELETE, OPTIONS",
      },
    }
  );
}

/*
=========================================================
HELPERS
=========================================================
*/

function parseNumber(
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
      value ?? ""
    )
      .trim()
      .replace(
        /\s/g,
        ""
      );

  if (!text) {
    return 0;
  }

  if (
    text.includes(",") &&
    text.includes(".")
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
    text.replace(
      ",",
      "."
    )
  );
}

function parseInteger(
  value: unknown
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return NaN;
  }

  return Math.trunc(
    number
  );
}

function serializeService(
  service: any
) {
  return {
    _id:
      service._id?.toString?.() ||
      String(
        service._id ||
          ""
      ),

    name:
      String(
        service.name ||
          ""
      ),

    description:
      String(
        service.description ||
          ""
      ),

    price:
      Number(
        service.price ||
          0
      ),

    duration:
      Number(
        service.duration ||
          30
      ),

    photoUrl:
      String(
        service.photoUrl ||
          ""
      ),

    active:
      service.active !==
      false,

    order:
      Number(
        service.order ||
          0
      ),

    createdAt:
      service.createdAt ||
      null,

    updatedAt:
      service.updatedAt ||
      null,
  };
}