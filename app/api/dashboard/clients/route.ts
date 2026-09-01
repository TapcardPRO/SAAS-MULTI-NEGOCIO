import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
=========================================================
GET
LISTAR CLIENTES
=========================================================
*/

export async function GET() {
  try {
    const auth = await requireBusinessSession();

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

    const businessVariants = buildIdVariants(
      auth.businessId
    );

    const clients = await auth.db
      .collection("clients")
      .find({
        businessId: {
          $in: businessVariants,
        },
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    return NextResponse.json({
      ok: true,

      clients: clients.map((client) => ({
        _id: client._id.toString(),

        name: String(
          client.name || ""
        ),

        phone: String(
          client.phone || ""
        ),

        phoneNormalized: String(
          client.phoneNormalized || ""
        ),

        email: String(
          client.email || ""
        ),

        notes: String(
          client.notes || ""
        ),

        visitsCount: Number(
          client.visitsCount ||
            client.totalVisits ||
            0
        ),

        totalVisits: Number(
          client.totalVisits ||
            client.visitsCount ||
            0
        ),

        totalSpent: Number(
          client.totalSpent || 0
        ),

        firstVisitAt:
          client.firstVisitAt || null,

        lastVisitAt:
          client.lastVisitAt ||
          client.lastVisit ||
          null,

        lastVisit:
          client.lastVisit ||
          client.lastVisitAt ||
          null,

        createdAt:
          client.createdAt || null,

        updatedAt:
          client.updatedAt || null,
      })),
    });
  } catch (error) {
    console.error(
      "GET DASHBOARD CLIENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar clientes",
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
CRIAR CLIENTE
=========================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    const auth = await requireBusinessSession();

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

    const name = String(
      body.name || ""
    ).trim();

    const phone = String(
      body.phone || ""
    ).trim();

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const notes = String(
      body.notes || ""
    ).trim();

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe o nome do cliente",
        },
        {
          status: 400,
        }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe o telefone do cliente",
        },
        {
          status: 400,
        }
      );
    }

    const phoneNormalized =
      normalizePhone(phone);

    const businessVariants =
      buildIdVariants(
        auth.businessId
      );

    /*
    =====================================================
    EVITAR CLIENTE DUPLICADO
    =====================================================
    */

    const existing =
      await auth.db
        .collection("clients")
        .findOne({
          businessId: {
            $in:
              businessVariants,
          },

          $or: [
            {
              phoneNormalized,
            },
            {
              phone,
            },
          ],
        });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Já existe um cliente com este telefone",
        },
        {
          status: 409,
        }
      );
    }

    const now =
      new Date();

    const client = {
      businessId:
        auth.businessId,

      name,

      phone,

      phoneNormalized,

      email,

      notes,

      visitsCount:
        0,

      totalVisits:
        0,

      totalSpent:
        0,

      firstVisitAt:
        null,

      lastVisitAt:
        null,

      lastVisit:
        null,

      active:
        true,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await auth.db
        .collection(
          "clients"
        )
        .insertOne(
          client
        );

    return NextResponse.json(
      {
        ok: true,

        message:
          "Cliente cadastrado com sucesso",

        client: {
          ...client,

          _id:
            result.insertedId.toString(),

          businessId:
            String(
              auth.businessId
            ),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST DASHBOARD CLIENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao cadastrar cliente",
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
  return NextResponse.json({
    ok: true,
  });
}

/*
=========================================================
HELPERS
=========================================================
*/

function buildIdVariants(
  value: unknown
): Array<string | ObjectId> {
  const stringValue =
    String(
      value || ""
    ).trim();

  const variants: Array<
    string | ObjectId
  > = [];

  if (stringValue) {
    variants.push(
      stringValue
    );
  }

  if (
    ObjectId.isValid(
      stringValue
    )
  ) {
    variants.push(
      new ObjectId(
        stringValue
      )
    );
  }

  return variants;
}

function normalizePhone(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}