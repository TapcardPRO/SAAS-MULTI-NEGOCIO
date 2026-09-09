import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

async function requireSuperAdmin() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("saas_session")?.value;

  if (!token) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não autenticado",
    };
  }

  const session =
    await verifySessionToken(token);

  if (
    !session?.userId ||
    !ObjectId.isValid(session.userId)
  ) {
    return {
      ok: false as const,
      status: 401,
      message: "Sessão inválida",
    };
  }

  const db = await getDb();

  const admin = await db
    .collection("users")
    .findOne({
      _id: new ObjectId(session.userId),
    });

  if (!admin) {
    return {
      ok: false as const,
      status: 401,
      message: "Usuário não encontrado",
    };
  }

  if (admin.role !== "superadmin") {
    return {
      ok: false as const,
      status: 403,
      message: "Acesso exclusivo do Super Admin",
    };
  }

  return {
    ok: true as const,
    db,
    admin,
  };
}

export async function GET(
  request: Request,
  { params }: RouteProps
) {
  try {
    const auth =
      await requireSuperAdmin();

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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa inválida",
        },
        {
          status: 400,
        }
      );
    }

    const business =
      await auth.db
        .collection("businesses")
        .findOne({
          _id: new ObjectId(id),
        });

    if (!business) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    let owner = null;

    if (
      business.ownerUserId &&
      ObjectId.isValid(
        String(business.ownerUserId)
      )
    ) {
      const ownerUser =
        await auth.db
          .collection("users")
          .findOne({
            _id: new ObjectId(
              String(business.ownerUserId)
            ),
          });

      if (ownerUser) {
        owner = {
          id: ownerUser._id.toString(),
          name: ownerUser.name || "",
          email: ownerUser.email || "",
          active:
            ownerUser.active !== false,
        };
      }
    }

    return NextResponse.json({
      ok: true,

      business: {
        id: business._id.toString(),
        name: business.name || "",
        slug: business.slug || "",
        category: business.category || "",
        whatsapp: business.whatsapp || "",
        plan: business.plan || "basico",

        active:
          business.active !==
          false,

        billingStatus:
          normalizeBillingStatus(
            business.billingStatus
          ),

        trialEndsAt:
          formatDateValue(
            business.trialEndsAt
          ),

        subscriptionEndsAt:
          formatDateValue(
            business.subscriptionEndsAt
          ),

        owner,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar empresa:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao buscar empresa",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: RouteProps
) {
  try {
    const auth =
      await requireSuperAdmin();

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

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa inválida",
        },
        {
          status: 400,
        }
      );
    }

    const business =
      await auth.db
        .collection("businesses")
        .findOne({
          _id: new ObjectId(id),
        });

    if (!business) {
      return NextResponse.json(
        {
          ok: false,
          message: "Empresa não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const body = await request.json();

    const updateData: Record<
      string,
      unknown
    > = {
      updatedAt: new Date(),
    };

    if (body.slug !== undefined) {
      const slug =
        normalizeSlug(
          String(
            body.slug ||
              ""
          )
        );

      if (!slug) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Informe um slug válido.",
          },
          {
            status: 400,
          }
        );
      }

      const reservedSlugs = [
        "admin",
        "api",
        "dashboard",
        "login",
        "entrar",
        "signup",
        "cadastro",
        "register",
        "_next",
        "favicon",
      ];

      if (
        reservedSlugs.includes(
          slug
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Este slug é reservado pelo sistema.",
          },
          {
            status: 400,
          }
        );
      }

      const duplicate =
        await auth.db
          .collection(
            "businesses"
          )
          .findOne({
            _id: {
              $ne:
                business._id,
            },

            slug,
          });

      if (duplicate) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Este slug já está sendo usado por outra empresa.",
          },
          {
            status: 409,
          }
        );
      }

      const oldSlug =
        String(
          business.slug ||
            ""
        );

      updateData.slug =
        slug;

      /*
      Atualiza referências desnormalizadas
      que utilizem businessSlug.
      */
      if (
        oldSlug &&
        oldSlug !== slug
      ) {
        const collections =
          await auth.db
            .listCollections(
              {},
              {
                nameOnly:
                  true,
              }
            )
            .toArray();

        for (
          const collectionInfo
          of collections
        ) {
          if (
            collectionInfo.name ===
              "businesses" ||
            collectionInfo.name.startsWith(
              "system."
            )
          ) {
            continue;
          }

          try {
            await auth.db
              .collection(
                collectionInfo.name
              )
              .updateMany(
                {
                  businessSlug:
                    oldSlug,
                },
                {
                  $set: {
                    businessSlug:
                      slug,

                    updatedAt:
                      new Date(),
                  },
                }
              );
          } catch (
            updateSlugError
          ) {
            console.error(
              `Erro ao atualizar businessSlug em ${collectionInfo.name}:`,
              updateSlugError
            );
          }
        }
      }
    }

    if (body.plan !== undefined) {
      const plan = String(body.plan);

      const selectedPlan =
        await auth.db
          .collection("saas_plans")
          .findOne({
            slug: plan,
            active: { $ne: false },
          });

      if (!selectedPlan) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "O plano selecionado não existe ou está desativado.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.plan = plan;
    }

    if (
      body.billingStatus !==
      undefined
    ) {
      const billingStatus =
        String(
          body.billingStatus ||
            ""
        )
          .trim()
          .toLowerCase();

      const allowed = [
        "trial",
        "active",
        "past_due",
        "cancelled",
      ];

      if (
        !allowed.includes(
          billingStatus
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Situação de cobrança inválida.",
          },
          {
            status: 400,
          }
        );
      }

      updateData.billingStatus =
        billingStatus;

      updateData.billingUpdatedAt =
        new Date();
    }

    if (
      body.trialEndsAt !==
      undefined
    ) {
      updateData.trialEndsAt =
        parseDateOrNull(
          body.trialEndsAt
        );
    }

    if (
      body.subscriptionEndsAt !==
      undefined
    ) {
      updateData.subscriptionEndsAt =
        parseDateOrNull(
          body.subscriptionEndsAt
        );
    }

    if (body.active !== undefined) {
      updateData.active =
        Boolean(body.active);
    }

    await auth.db
      .collection("businesses")
      .updateOne(
        {
          _id: business._id,
        },
        {
          $set: updateData,
        }
      );

    /*
     * Se a empresa for bloqueada,
     * também bloqueamos o usuário dono.
     *
     * Se for reativada,
     * reativamos o dono.
     */
    if (
      body.active !== undefined &&
      business.ownerUserId &&
      ObjectId.isValid(
        String(business.ownerUserId)
      )
    ) {
      await auth.db
        .collection("users")
        .updateOne(
          {
            _id: new ObjectId(
              String(business.ownerUserId)
            ),
          },
          {
            $set: {
              active:
                Boolean(body.active),
              updatedAt: new Date(),
            },
          }
        );
    }

    const updatedBusiness =
      await auth.db
        .collection("businesses")
        .findOne({
          _id: business._id,
        });

    let owner = null;

    if (
      updatedBusiness?.ownerUserId &&
      ObjectId.isValid(
        String(
          updatedBusiness.ownerUserId
        )
      )
    ) {
      const ownerUser =
        await auth.db
          .collection("users")
          .findOne({
            _id: new ObjectId(
              String(
                updatedBusiness.ownerUserId
              )
            ),
          });

      if (ownerUser) {
        owner = {
          id: ownerUser._id.toString(),
          name: ownerUser.name || "",
          email: ownerUser.email || "",
          active:
            ownerUser.active !== false,
        };
      }
    }

    return NextResponse.json({
      ok: true,

      message:
        "Empresa atualizada com sucesso",

      business: {
        id:
          updatedBusiness?._id.toString() ||
          id,

        name:
          updatedBusiness?.name || "",

        slug:
          updatedBusiness?.slug || "",

        category:
          updatedBusiness?.category || "",

        whatsapp:
          updatedBusiness?.whatsapp || "",

        plan:
          updatedBusiness?.plan ||
          "basico",

        active:
          updatedBusiness?.active !==
          false,

        billingStatus:
          normalizeBillingStatus(
            updatedBusiness?.billingStatus
          ),

        trialEndsAt:
          formatDateValue(
            updatedBusiness?.trialEndsAt
          ),

        subscriptionEndsAt:
          formatDateValue(
            updatedBusiness?.subscriptionEndsAt
          ),

        owner,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar empresa:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar empresa",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteProps
) {
  try {
    const auth =
      await requireSuperAdmin();

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

    const { id } =
      await params;

    if (
      !ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Empresa inválida",
        },
        {
          status: 400,
        }
      );
    }

    const businessId =
      new ObjectId(id);

    const business =
      await auth.db
        .collection(
          "businesses"
        )
        .findOne({
          _id:
            businessId,
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

    const body =
      await request
        .json()
        .catch(
          () => ({})
        );

    const confirmation =
      String(
        body.confirmation ||
          ""
      )
        .trim()
        .toLowerCase();

    const expected =
      String(
        business.slug ||
          business.name ||
          ""
      )
        .trim()
        .toLowerCase();

    if (
      !expected ||
      confirmation !== expected
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            `Para excluir, confirme digitando "${expected}".`,
        },
        {
          status: 400,
        }
      );
    }

    const businessSlug =
      String(
        business.slug ||
          ""
      );

    const businessIdString =
      businessId.toString();

    /*
    =====================================================
    EXCLUSÃO DOS DADOS DO TENANT
    =====================================================

    Percorremos as coleções e removemos somente
    documentos vinculados à empresa pelo businessId
    ou businessSlug.

    customer_accounts normalmente é uma conta global
    do cliente e por isso é preservada.
    */

    const protectedCollections =
      new Set([
        "businesses",
        "customer_accounts",
        "saas_plans",
      ]);

    const collections =
      await auth.db
        .listCollections(
          {},
          {
            nameOnly: true,
          }
        )
        .toArray();

    const deletedByCollection:
      Record<
        string,
        number
      > = {};

    for (
      const collectionInfo
      of collections
    ) {
      const name =
        collectionInfo.name;

      if (
        protectedCollections.has(
          name
        ) ||
        name.startsWith(
          "system."
        )
      ) {
        continue;
      }

      try {
        const conditions:
          Record<
            string,
            unknown
          >[] = [
            {
              businessId,
            },
            {
              businessId:
                businessIdString,
            },
          ];

        if (businessSlug) {
          conditions.push({
            businessSlug,
          });
        }

        /*
        Usuário proprietário antigo pode estar
        ligado apenas por ownerUserId.
        */
        if (
          name === "users" &&
          business.ownerUserId
        ) {
          conditions.push({
            _id:
              ObjectId.isValid(
                String(
                  business.ownerUserId
                )
              )
                ? new ObjectId(
                    String(
                      business.ownerUserId
                    )
                  )
                : business.ownerUserId,
          });
        }

        const result =
          await auth.db
            .collection(name)
            .deleteMany({
              $or:
                conditions,
            });

        if (
          result.deletedCount >
          0
        ) {
          deletedByCollection[
            name
          ] =
            result.deletedCount;
        }
      } catch (
        deleteError
      ) {
        console.error(
          `Erro ao excluir dados da coleção ${name}:`,
          deleteError
        );

        return NextResponse.json(
          {
            ok: false,
            message:
              `Não foi possível concluir a exclusão. Falha na coleção ${name}.`,
          },
          {
            status: 500,
          }
        );
      }
    }

    await auth.db
      .collection(
        "businesses"
      )
      .deleteOne({
        _id:
          businessId,
      });

    return NextResponse.json({
      ok: true,

      message:
        "Empresa excluída com sucesso.",

      deletedByCollection,
    });
  } catch (error) {
    console.error(
      "Erro ao excluir empresa:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao excluir empresa",
      },
      {
        status: 500,
      }
    );
  }
}

function normalizeSlug(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(
      0,
      80
    );
}

function normalizeBillingStatus(
  value: unknown
) {
  const status =
    String(
      value ||
        ""
    )
      .trim()
      .toLowerCase();

  if (
    [
      "trial",
      "active",
      "past_due",
      "cancelled",
    ].includes(
      status
    )
  ) {
    return status;
  }

  return "active";
}

function formatDateValue(
  value: unknown
) {
  if (!value) {
    return "";
  }

  if (
    value instanceof Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10
      );
  }

  return String(
    value
  ).slice(
    0,
    10
  );
}

function parseDateOrNull(
  value: unknown
) {
  const text =
    String(
      value ||
        ""
    ).trim();

  if (!text) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      text
    )
  ) {
    return null;
  }

  const date =
    new Date(
      `${text}T12:00:00.000Z`
    );

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}
