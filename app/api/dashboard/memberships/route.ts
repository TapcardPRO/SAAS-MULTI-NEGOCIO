import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAuthenticatedBusiness() {
  const auth = await requireBusinessSession();
  if (!auth.ok) {
    return { error: NextResponse.json({ message: auth.message }, { status: auth.status }) };
  }
  return auth;
}

/*
=========================================================
GET - LISTAR MENSALISTAS
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
      user,
      business,
      businessId,
    } = auth;

    const tenantFilters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      tenantFilters.push({
        businessSlug:
          business.slug,
      });
    }

    const professionalId = String(user.professionalId || "");
    if (user.role === "employee" && !ObjectId.isValid(professionalId)) {
      return NextResponse.json({ message: "Profissional não vinculado ao usuário" }, { status: 403 });
    }
    const membershipFilter: any = {
      $or: tenantFilters,
      ...(user.role === "employee"
        ? { professionalId: { $in: [professionalId, new ObjectId(professionalId)] } }
        : {}),
    };

    const now = new Date();
    const currentCycle = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    await db.collection("memberships").updateMany({ ...membershipFilter, active: { $ne: false }, paymentStatus: "paid", startDate: { $lte: `${currentCycle}-31` }, cycleKey: { $ne: currentCycle } }, [{ $set: { cycleKey: currentCycle, usedUses: 0, remainingUses: "$totalUses", expiresAt: monthEndDate(`${currentCycle}-01`), updatedAt: now } }]);

    const memberships = await db
      .collection("memberships")
      .find(
        membershipFilter
      )
      .sort({
        createdAt: -1,
      })
      .toArray();

    return NextResponse.json({
      viewer: {
        role:
          user.role ||
          "owner",
      },

      memberships: memberships.map(
        (membership) => ({
          _id:
            membership._id.toString(),

          clientId:
            membership.clientId
              ? String(
                  membership.clientId
                )
              : "",

          clientName:
            membership.clientName ||
            "Cliente",

          clientPhone:
            membership.clientPhone ||
            "",

          planId:
            membership.planId
              ? String(
                  membership.planId
                )
              : "",

          planName:
            membership.planName ||
            "Plano",

          price:
            Number(
              membership.price || 0
            ),

          totalUses:
            Number(
              membership.totalUses || 0
            ),

          usedUses:
            Number(
              membership.usedUses || 0
            ),

          remainingUses:
            Number(
              membership.remainingUses ?? 0
            ),

          validityDays:
            Number(
              membership.validityDays || 0
            ),
          allowedDays: Array.isArray(membership.allowedDays) ? membership.allowedDays.map(Number) : [0,1,2,3,4,5,6],
          allowedStartTime: String(membership.allowedStartTime || "00:00"),
          allowedEndTime: String(membership.allowedEndTime || "23:59"),
          cycleKey: String(membership.cycleKey || ""),

          serviceIds:
            Array.isArray(
              membership.serviceIds
            )
              ? membership.serviceIds.map(
                  String
                )
              : [],

          startDate:
            membership.startDate || "",

          expiresAt:
            membership.expiresAt || "",

          active:
            membership.active !== false,

          paymentMethod:
            membership.paymentMethod ||
            "later",

          paymentStatus:
            membership.paymentStatus ||
            "pending",

          paymentAmount:
            Number(
              membership.paymentAmount ??
                membership.price ??
                0
            ),

          paymentDueDate:
            membership.paymentDueDate ||
            "",

          paymentPaidAt:
            membership.paymentPaidAt ||
            null,

          pixTransactionId:
            membership.pixTransactionId ||
            "",

          pixQrCode:
            membership.pixQrCode || "",

          pixCopyPaste:
            membership.pixCopyPaste ||
            "",

          createdAt:
            membership.createdAt || null,

          updatedAt:
            membership.updatedAt || null,
        })
      ),
    });
  } catch (error) {
    console.error(
      "GET MEMBERSHIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar mensalistas",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
POST - CADASTRAR MENSALISTA
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
      user,
      business,
      businessId,
    } = auth;

    const professionalId = user.role === "employee" ? String(user.professionalId || "") : ""; 
    if (user.role === "employee" && !ObjectId.isValid(professionalId)) {
      return NextResponse.json({ message: "Profissional não vinculado ao usuário" }, { status: 403 });
    }

    let body: any = {};

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          message:
            "Dados enviados são inválidos",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "BODY MENSALISTA RECEBIDO:",
      body
    );

    const clientId =
      String(
        body.clientId || ""
      ).trim();

    const planId =
      String(
        body.planId || ""
      ).trim();

    const startDate =
      String(
        body.startDate || ""
      ).trim();

    const paymentMethod =
      String(
        body.paymentMethod || "later"
      ).trim();

    const paymentStatus =
      body.paymentStatus === "paid"
        ? "paid"
        : "pending";

    const paymentDueDate =
      String(
        body.paymentDueDate ||
          startDate ||
          ""
      ).trim();

    /*
    CLIENTE
    */

    if (
      !clientId ||
      !ObjectId.isValid(clientId)
    ) {
      return NextResponse.json(
        {
          message:
            "Cliente inválido",
        },
        {
          status: 400,
        }
      );
    }

    /*
    PLANO

    Aqui só validamos o ID.
    Não pedimos nome do plano.
    */

    if (
      !planId ||
      !ObjectId.isValid(planId)
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

    if (
      !isValidDateString(startDate)
    ) {
      return NextResponse.json(
        {
          message:
            "Data inicial inválida",
        },
        {
          status: 400,
        }
      );
    }

    if (
      paymentStatus === "pending" &&
      !isValidDateString(
        paymentDueDate
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Data de vencimento inválida",
        },
        {
          status: 400,
        }
      );
    }

    const allowedPaymentMethods = [
      "pix",
      "cash",
      "card",
      "later",
    ];

    if (
      !allowedPaymentMethods.includes(
        paymentMethod
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Forma de pagamento inválida",
        },
        {
          status: 400,
        }
      );
    }

    const clientObjectId =
      new ObjectId(clientId);

    const planObjectId =
      new ObjectId(planId);

    /*
    BUSCAR CLIENTE
    */

    const clientFilters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      clientFilters.push({
        businessSlug:
          business.slug,
      });
    }

    const client = await db
      .collection("clients")
      .findOne({
        _id: clientObjectId,

        $or: clientFilters,
        ...(user.role === "employee"
          ? { professionalId: { $in: [professionalId, new ObjectId(professionalId)] } }
          : {}),
      });

    if (!client) {
      return NextResponse.json(
        {
          message:
            "Cliente não encontrado nesta empresa",
        },
        {
          status: 404,
        }
      );
    }

    /*
    BUSCAR PLANO
    */

    const planFilters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      planFilters.push({
        businessSlug:
          business.slug,
      });
    }

    const plan = await db
      .collection("plans")
      .findOne({
        _id: planObjectId,

        active: {
          $ne: false,
        },

        $or: planFilters,
        ...(user.role === "employee"
          ? { professionalId: new ObjectId(professionalId) }
          : {}),
      });

    if (!plan) {
      return NextResponse.json(
        {
          message:
            "Plano não encontrado ou está inativo",
        },
        {
          status: 404,
        }
      );
    }

    /*
    AQUI PEGAMOS O NOME DO PLANO
    DIRETO DO BANCO

    O FRONTEND NÃO PRECISA ENVIAR planName.
    */

    const planName =
      String(
        plan.name || ""
      ).trim();

    if (!planName) {
      return NextResponse.json(
        {
          message:
            "O plano cadastrado está sem nome. Edite o plano e salve novamente.",
        },
        {
          status: 400,
        }
      );
    }

    const price =
      Number(
        plan.price || 0
      );

    const totalUses =
      Number(
        plan.totalUses || 0
      );

    const validityDays =
      Number(
        plan.validityDays || 30
      );
    const allowedDays = Array.isArray(plan.allowedDays) ? plan.allowedDays.map(Number) : [0,1,2,3,4,5,6];
    const allowedStartTime = String(plan.allowedStartTime || "00:00");
    const allowedEndTime = String(plan.allowedEndTime || "23:59");

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          message:
            "O preço do plano é inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(totalUses) ||
      totalUses <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "A quantidade de usos do plano é inválida",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(validityDays) ||
      validityDays <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "A validade do plano é inválida",
        },
        {
          status: 400,
        }
      );
    }

    /*
    EVITAR MESMO PLANO ATIVO DUPLICADO
    */

    const duplicateFilters: any[] = [
      {
        businessId,
      },
      {
        businessId:
          businessId.toString(),
      },
    ];

    if (business.slug) {
      duplicateFilters.push({
        businessSlug:
          business.slug,
      });
    }

    const existingMembership =
      await db
        .collection("memberships")
        .findOne({
          clientId:
            clientObjectId,

          planId:
            planObjectId,

          active: {
            $ne: false,
          },

          $or:
            duplicateFilters,
        });

    if (existingMembership) {
      return NextResponse.json(
        {
          message:
            "Este cliente já possui este plano ativo.",
        },
        {
          status: 409,
        }
      );
    }

    const cycleKey = startDate.slice(0, 7);
    const expiresAt = monthEndDate(startDate);

    const now =
      new Date();

    /*
    SNAPSHOT DO PLANO

    Se o preço mudar depois,
    este mensalista mantém
    o valor contratado.
    */

    const membership = {
      businessId,

      professionalId: user.role === "employee"
        ? new ObjectId(professionalId)
        : (plan.professionalId || null),

      businessSlug:
        business.slug || "",

      clientId:
        clientObjectId,

      clientName:
        String(
          client.name || "Cliente"
        ),

      clientPhone:
        String(
          client.phone || ""
        ),

      planId:
        planObjectId,

      planName,

      price,

      totalUses,

      usedUses: 0,

      remainingUses:
        totalUses,

      validityDays,
      allowedDays,
      allowedStartTime,
      allowedEndTime,
      cycleKey,

      /*
      SNAPSHOT DOS SERVIÇOS DO PLANO.

      Alterar o plano futuramente não
      muda retroativamente o contrato
      já vendido ao mensalista.
      */
      serviceIds:
        Array.isArray(
          plan.serviceIds
        )
          ? plan.serviceIds
              .map(
                (
                  value: unknown
                ) =>
                  ObjectId.isValid(
                    String(value)
                  )
                    ? new ObjectId(
                        String(value)
                      )
                    : null
              )
              .filter(Boolean)
          : [],

      startDate,

      expiresAt,

      active: true,

      /*
      PAGAMENTO
      */

      paymentMethod,

      paymentStatus,

      paymentAmount:
        price,

      paymentDueDate:
        paymentStatus === "paid"
          ? startDate
          : paymentDueDate,

      paymentPaidAt:
        paymentStatus === "paid"
          ? now
          : null,

      /*
      PIX

      Ainda vazios até integrar
      com gateway real.
      */

      pixTransactionId: "",

      pixQrCode: "",

      pixCopyPaste: "",

      createdAt: now,

      updatedAt: now,
    };

    const result = await db
      .collection("memberships")
      .insertOne(membership);

    return NextResponse.json(
      {
        message:
          "Mensalista cadastrado com sucesso",

        membership: {
          _id:
            result.insertedId.toString(),

          clientId,

          clientName:
            membership.clientName,

          clientPhone:
            membership.clientPhone,

          planId,

          planName,

          price,

          totalUses,

          usedUses: 0,

          remainingUses:
            totalUses,

          validityDays,

          startDate,

          expiresAt,

          active: true,

          paymentMethod,

          paymentStatus,

          paymentAmount:
            price,

          paymentDueDate:
            membership.paymentDueDate,

          paymentPaidAt:
            membership.paymentPaidAt,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST MEMBERSHIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao cadastrar mensalista",
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
          "GET, POST, OPTIONS",
      },
    }
  );
}

/*
=========================================================
HELPERS
=========================================================
*/

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

function monthEndDate(value: string) {
  const [year, month] = value.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0, 12));
  return `${last.getUTCFullYear()}-${String(last.getUTCMonth()+1).padStart(2,"0")}-${String(last.getUTCDate()).padStart(2,"0")}`;
}

function addDays(
  value: string,
  days: number
) {
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

  date.setUTCDate(
    date.getUTCDate() +
      days
  );

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}