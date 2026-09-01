import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
=========================================================
AUTENTICAÇÃO
=========================================================
*/

async function getAuthenticatedBusiness() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário não autenticado",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const session =
    await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(String(session.userId))
  ) {
    return {
      error: NextResponse.json(
        {
          message: "Sessão inválida",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const db = await getDb();

  const user =
    await db.collection("users").findOne({
      _id: new ObjectId(
        String(session.userId)
      ),
    });

  if (!user) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário não encontrado",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (user.active === false) {
    return {
      error: NextResponse.json(
        {
          message: "Usuário bloqueado",
        },
        {
          status: 403,
        }
      ),
    };
  }

  if (!user.businessId) {
    return {
      error: NextResponse.json(
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
    String(user.businessId);

  if (
    !ObjectId.isValid(
      businessIdString
    )
  ) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa inválida",
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
      .collection("businesses")
      .findOne({
        _id: businessId,
      });

  if (!business) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa não encontrada",
        },
        {
          status: 404,
        }
      ),
    };
  }

  if (business.active === false) {
    return {
      error: NextResponse.json(
        {
          message: "Empresa bloqueada",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    db,
    businessId,
    business,
  };
}

/*
=========================================================
GET - LISTAR PLANOS
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
      businessId,
      business,
    } = auth;

    const filters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      filters.push({
        businessSlug:
          business.slug,
      });
    }

    const plans =
      await db
        .collection("plans")
        .find({
          $or: filters,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

    return NextResponse.json({
      plans: plans.map(
        (plan) => ({
          _id:
            plan._id.toString(),

          name:
            plan.name || "",

          description:
            plan.description || "",

          price:
            Number(
              plan.price || 0
            ),

          totalUses:
            Number(
              plan.totalUses || 0
            ),

          validityDays:
            Number(
              plan.validityDays || 30
            ),

          active:
            plan.active !== false,

          createdAt:
            plan.createdAt || null,

          updatedAt:
            plan.updatedAt || null,
        })
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

/*
=========================================================
POST - CRIAR PLANO
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

    const {
      db,
      businessId,
      business,
    } = auth;

    let body: any = {};

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          message:
            "Não foi possível ler os dados enviados",
        },
        {
          status: 400,
        }
      );
    }

    /*
      IMPORTANTE:
      ISSO VAI APARECER NO TERMINAL
      QUANDO VOCÊ TENTAR CADASTRAR.
    */

    console.log(
      "================================="
    );

    console.log(
      "BODY PLANO RECEBIDO:"
    );

    console.log(body);

    console.log(
      "CAMPOS RECEBIDOS:"
    );

    console.log(
      Object.keys(body)
    );

    console.log(
      "================================="
    );

    /*
      ACEITA VÁRIOS NOMES POSSÍVEIS
    */

    const name =
      firstText([
        body.name,
        body.planName,
        body.nome,
        body.nomePlano,
        body.title,
        body.titulo,
      ]);

    const description =
      firstText([
        body.description,
        body.descricao,
        body.planDescription,
      ]);

    const rawPrice =
      firstDefined([
        body.price,
        body.valor,
        body.value,
        body.preco,
        body.monthlyPrice,
      ]);

    const rawTotalUses =
      firstDefined([
        body.totalUses,
        body.uses,
        body.usages,
        body.quantity,
        body.quantidade,
        body.quantidadeUsos,
        body.cuts,
        body.totalCuts,
      ]);

    const rawValidityDays =
      firstDefined([
        body.validityDays,
        body.validity,
        body.days,
        body.validade,
        body.diasValidade,
      ]);

    const price =
      parseMoney(
        rawPrice
      );

    const totalUses =
      parseInteger(
        rawTotalUses
      );

    const validityDays =
      rawValidityDays ===
      undefined
        ? 30
        : parseInteger(
            rawValidityDays
          );

    const active =
      body.active === undefined
        ? true
        : parseBoolean(
            body.active
          );

    /*
      LOG DO QUE A API ENTENDEU
    */

    console.log(
      "PLANO INTERPRETADO:",
      {
        name,
        description,
        price,
        totalUses,
        validityDays,
        active,
      }
    );

    /*
      VALIDAÇÃO
    */

    if (!name) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do plano",

          debug: {
            receivedFields:
              Object.keys(body),

            body,
          },
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          message:
            "Informe um preço válido",

          debug: {
            receivedPrice:
              rawPrice,
          },
        },
        {
          status: 400,
        }
      );
    }

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

          debug: {
            receivedTotalUses:
              rawTotalUses,
          },
        },
        {
          status: 400,
        }
      );
    }

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

          debug: {
            receivedValidityDays:
              rawValidityDays,
          },
        },
        {
          status: 400,
        }
      );
    }

    const now =
      new Date();

    const plan = {
      businessId,

      businessSlug:
        business.slug || "",

      name,

      description,

      price,

      totalUses,

      validityDays,

      active,

      createdAt: now,

      updatedAt: now,
    };

    const result =
      await db
        .collection("plans")
        .insertOne(plan);

    return NextResponse.json(
      {
        message:
          "Plano cadastrado com sucesso",

        plan: {
          _id:
            result.insertedId.toString(),

          name,

          description,

          price,

          totalUses,

          validityDays,

          active,
        },
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

/*
=========================================================
PUT - EDITAR PLANO
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

    const {
      db,
      businessId,
      business,
    } = auth;

    let body: any = {};

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
      firstText([
        body.id,
        body._id,
        body.planId,
      ]);

    if (
      !id ||
      !ObjectId.isValid(id)
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

    const planObjectId =
      new ObjectId(id);

    const filters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      filters.push({
        businessSlug:
          business.slug,
      });
    }

    const existing =
      await db
        .collection("plans")
        .findOne({
          _id:
            planObjectId,

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

    /*
      NOME
    */

    const name =
      firstText([
        body.name,
        body.planName,
        body.nome,
        body.nomePlano,
        body.title,
        body.titulo,
      ]);

    if (
      body.name !== undefined ||
      body.planName !== undefined ||
      body.nome !== undefined ||
      body.nomePlano !== undefined ||
      body.title !== undefined ||
      body.titulo !== undefined
    ) {
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

    /*
      DESCRIÇÃO
    */

    if (
      body.description !==
        undefined ||
      body.descricao !==
        undefined ||
      body.planDescription !==
        undefined
    ) {
      update.description =
        firstText([
          body.description,
          body.descricao,
          body.planDescription,
        ]);
    }

    /*
      PREÇO
    */

    if (
      body.price !== undefined ||
      body.valor !== undefined ||
      body.value !== undefined ||
      body.preco !== undefined ||
      body.monthlyPrice !== undefined
    ) {
      const price =
        parseMoney(
          firstDefined([
            body.price,
            body.valor,
            body.value,
            body.preco,
            body.monthlyPrice,
          ])
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

    /*
      USOS
    */

    if (
      body.totalUses !==
        undefined ||
      body.uses !==
        undefined ||
      body.usages !==
        undefined ||
      body.quantity !==
        undefined ||
      body.quantidade !==
        undefined ||
      body.quantidadeUsos !==
        undefined ||
      body.cuts !==
        undefined ||
      body.totalCuts !==
        undefined
    ) {
      const totalUses =
        parseInteger(
          firstDefined([
            body.totalUses,
            body.uses,
            body.usages,
            body.quantity,
            body.quantidade,
            body.quantidadeUsos,
            body.cuts,
            body.totalCuts,
          ])
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

    /*
      VALIDADE
    */

    if (
      body.validityDays !==
        undefined ||
      body.validity !==
        undefined ||
      body.days !==
        undefined ||
      body.validade !==
        undefined ||
      body.diasValidade !==
        undefined
    ) {
      const validityDays =
        parseInteger(
          firstDefined([
            body.validityDays,
            body.validity,
            body.days,
            body.validade,
            body.diasValidade,
          ])
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

    /*
      ATIVO
    */

    if (
      body.active !==
      undefined
    ) {
      update.active =
        parseBoolean(
          body.active
        );
    }

    await db
      .collection("plans")
      .updateOne(
        {
          _id:
            planObjectId,
        },
        {
          $set:
            update,
        }
      );

    const updatedPlan =
      await db
        .collection("plans")
        .findOne({
          _id:
            planObjectId,
        });

    return NextResponse.json({
      message:
        "Plano atualizado com sucesso",

      plan: {
        _id:
          updatedPlan?._id.toString(),

        name:
          updatedPlan?.name || "",

        description:
          updatedPlan?.description ||
          "",

        price:
          Number(
            updatedPlan?.price ||
              0
          ),

        totalUses:
          Number(
            updatedPlan?.totalUses ||
              0
          ),

        validityDays:
          Number(
            updatedPlan?.validityDays ||
              30
          ),

        active:
          updatedPlan?.active !==
          false,
      },
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

/*
=========================================================
DELETE - EXCLUIR PLANO
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

    const {
      db,
      businessId,
      business,
    } = auth;

    const url =
      new URL(
        request.url
      );

    let id =
      url.searchParams.get(
        "id"
      ) || "";

    if (!id) {
      try {
        const body =
          await request.json();

        id =
          firstText([
            body.id,
            body._id,
            body.planId,
          ]);
      } catch {
        // sem body
      }
    }

    if (
      !id ||
      !ObjectId.isValid(id)
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

    const filters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      filters.push({
        businessSlug:
          business.slug,
      });
    }

    const result =
      await db
        .collection("plans")
        .deleteOne({
          _id:
            new ObjectId(id),

          $or:
            filters,
        });

    if (
      result.deletedCount ===
      0
    ) {
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
FUNÇÕES AUXILIARES
=========================================================
*/

function firstText(
  values: unknown[]
) {
  for (
    const value
    of values
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      continue;
    }

    const text =
      String(value).trim();

    if (text) {
      return text;
    }
  }

  return "";
}

function firstDefined(
  values: unknown[]
) {
  for (
    const value
    of values
  ) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return undefined;
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

  let text =
    String(
      value ?? ""
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

  /*
    120,00
  */

  if (
    text.includes(",") &&
    !text.includes(".")
  ) {
    text =
      text.replace(
        ",",
        "."
      );

    return Number(
      text
    );
  }

  /*
    1.200,00
  */

  if (
    text.includes(".") &&
    text.includes(",")
  ) {
    text =
      text
        .replace(
          /\./g,
          ""
        )
        .replace(
          ",",
          "."
        );

    return Number(
      text
    );
  }

  return Number(
    text
  );
}

function parseInteger(
  value: unknown
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return NaN;
  }

  return Number(
    value
  );
}

function parseBoolean(
  value: unknown
) {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return false;
  }

  return true;
}