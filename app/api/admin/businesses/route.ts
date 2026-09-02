export async function GET() {
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

    const businesses =
      await auth.db
        .collection("businesses")
        .find({})
        .sort({
          createdAt: -1,
        })
        .toArray();

    const result = await Promise.all(
      businesses.map(
        async (business) => {
          let owner = null;

          if (
            business.ownerUserId &&
            ObjectId.isValid(
              String(
                business.ownerUserId
              )
            )
          ) {
            const ownerUser =
              await auth.db
                .collection("users")
                .findOne({
                  _id: new ObjectId(
                    String(
                      business.ownerUserId
                    )
                  ),
                });

            if (ownerUser) {
              owner = {
                name:
                  ownerUser.name || "",
                email:
                  ownerUser.email || "",
              };
            }
          }

          return {
            id:
              business._id.toString(),

            name:
              business.name || "",

            slug:
              business.slug || "",

            category:
              business.category || "",

            plan:
              business.plan ||
              "basico",

            active:
              business.active !==
              false,

            billingStatus:
              String(
                business.billingStatus ||
                  "active"
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
          };
        }
      )
    );

    return NextResponse.json({
      ok: true,
      businesses: result,
    });
  } catch (error) {
    console.error(
      "Erro ao listar empresas:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao listar empresas",
      },
      {
        status: 500,
      }
    );
  }
}
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import {
  hashPassword,
  verifySessionToken,
} from "@/lib/auth";

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
      message:
        "Acesso exclusivo do Super Admin",
    };
  }

  return {
    ok: true as const,
    db,
    admin,
  };
}

export async function POST(
  request: Request
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

    const body =
      await request.json();

    const businessName = String(
      body.businessName || ""
    ).trim();

    const slug = createSlug(
      String(body.slug || "")
    );

    const category = String(
      body.category || ""
    ).trim();

    const whatsapp = String(
      body.whatsapp || ""
    ).trim();

    const ownerName = String(
      body.ownerName || ""
    ).trim();

    const ownerEmail = String(
      body.ownerEmail || ""
    )
      .trim()
      .toLowerCase();

    const ownerPassword =
      String(
        body.ownerPassword || ""
      );

    const plan = String(
      body.plan || "basico"
    );

    const active =
      body.active !== false;

    if (!businessName) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe o nome da empresa",
        },
        {
          status: 400,
        }
      );
    }

    if (!slug) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um slug válido",
        },
        {
          status: 400,
        }
      );
    }

    if (!ownerName) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe o nome do responsável",
        },
        {
          status: 400,
        }
      );
    }

    if (!ownerEmail) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe o e-mail do responsável",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ownerPassword.length < 6
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A senha precisa ter pelo menos 6 caracteres",
        },
        {
          status: 400,
        }
      );
    }

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
            "O plano selecionado não existe ou está inativo.",
        },
        {
          status: 400,
        }
      );
    }

    const existingBusiness =
      await auth.db
        .collection("businesses")
        .findOne({
          slug,
        });

    if (existingBusiness) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Já existe uma empresa com esse slug",
        },
        {
          status: 409,
        }
      );
    }

    const existingUser =
      await auth.db
        .collection("users")
        .findOne({
          email: ownerEmail,
        });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Já existe um usuário com esse e-mail",
        },
        {
          status: 409,
        }
      );
    }

    const passwordHash =
      await hashPassword(
        ownerPassword
      );

    const now = new Date();

    const business = {
      name: businessName,
      slug,
      category,
      whatsapp,

      description: "",
      instagram: "",
      address: "",

      primaryColor:
        "#22c55e",

      secondaryColor:
        "#18181b",

      backgroundColor:
        "#09090b",

      textColor:
        "#ffffff",

      logoUrl: "",
      coverUrl: "",
      gallery: [],

      mainButtonText:
        "Agendar agora",

      mainButtonType:
        "booking",

      mainButtonUrl: "",

      servicesTitle:
        "Escolha o que você precisa",

      showProfessionals: true,

      showBookingSection: true,

      bookingSectionLabel:
        "Agendamento",

      bookingSectionTitle:
        "Escolha seu horário",

      bookingSectionDescription:
        "Escolha o serviço e encontre o melhor horário para você.",

      plan,

      active,

      /*
      CONTROLE COMERCIAL DO VELLTO

      Não cobra automaticamente ainda.
      Esses campos serão usados pelo
      gateway de pagamento posteriormente.
      */

      billingStatus:
        "trial",

      trialStartedAt:
        now,

      trialEndsAt:
        new Date(
          now.getTime() +
            14 *
              24 *
              60 *
              60 *
              1000
        ),

      subscriptionEndsAt:
        null,

      billingUpdatedAt:
        now,

      ownerUserId: null,

      workingHours: {
        sunday: { open: false, start: "09:00", end: "14:00" },
        monday: { open: true, start: "09:00", end: "19:00" },
        tuesday: { open: true, start: "09:00", end: "19:00" },
        wednesday: { open: true, start: "09:00", end: "19:00" },
        thursday: { open: true, start: "09:00", end: "19:00" },
        friday: { open: true, start: "09:00", end: "19:00" },
        saturday: { open: true, start: "09:00", end: "18:00" },
      },

      createdAt: now,
      updatedAt: now,
    };

    const businessResult =
      await auth.db
        .collection("businesses")
        .insertOne(business);

    try {
      const user = {
        name: ownerName,
        email: ownerEmail,

        passwordHash,

        businessId:
          businessResult.insertedId,

        role: "owner",

        active: true,

        createdAt: now,
        updatedAt: now,
      };

      const userResult =
        await auth.db
          .collection("users")
          .insertOne(user);

      await auth.db
        .collection("businesses")
        .updateOne(
          {
            _id:
              businessResult.insertedId,
          },
          {
            $set: {
              ownerUserId:
                userResult.insertedId,

              updatedAt:
                new Date(),
            },
          }
        );

      return NextResponse.json(
        {
          ok: true,

          message:
            "Empresa e acesso criados com sucesso",

          business: {
            id:
              businessResult.insertedId.toString(),

            name:
              businessName,

            slug,

            plan,

            active,
          },

          owner: {
            id:
              userResult.insertedId.toString(),

            name:
              ownerName,

            email:
              ownerEmail,

            role:
              "owner",
          },
        },
        {
          status: 201,
        }
      );
    } catch (error) {
      /*
       * Se a criação do usuário falhar,
       * removemos a empresa recém-criada
       * para não deixar cadastro incompleto.
       */
      await auth.db
        .collection("businesses")
        .deleteOne({
          _id:
            businessResult.insertedId,
        });

      throw error;
    }
  } catch (error) {
    console.error(
      "Erro ao criar empresa:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao criar empresa e acesso",
      },
      {
        status: 500,
      }
    );
  }
}

function createSlug(
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
    );
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
      .slice(0, 10);
  }

  return String(
    value
  ).slice(
    0,
    10
  );
}
