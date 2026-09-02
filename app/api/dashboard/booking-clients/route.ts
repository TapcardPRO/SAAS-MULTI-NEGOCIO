import {
  NextRequest,
  NextResponse,
} from "next/server";

import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export async function GET() {
  try {
    const auth =
      await requireBusinessSession();

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

    const businessVariants: Array<
      string | ObjectId
    > = [
      auth.businessId,
      auth.businessId.toString(),
    ];

    const clients =
      await auth.db
        .collection("clients")
        .find({
          businessId: {
            $in:
              businessVariants,
          },

          active: {
            $ne: false,
          },
        })
        .sort({
          name: 1,
        })
        .project({
          name: 1,
          phone: 1,
        })
        .toArray();

    return NextResponse.json({
      ok: true,

      clients:
        clients.map(
          (client) => ({
            _id:
              client._id.toString(),

            name:
              String(
                client.name || ""
              ),

            phone:
              String(
                client.phone || ""
              ),
          })
        ),
    });
  } catch (error) {
    console.error(
      "BOOKING CLIENTS GET ERROR:",
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
CADASTRAR CLIENTE RÁPIDO
=========================================================
*/

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await requireBusinessSession();

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

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const phone =
      String(
        body.phone || ""
      ).trim();

    if (
      name.length < 2
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe o nome do cliente.",
        },
        {
          status: 400,
        }
      );
    }

    const phoneNormalized =
      normalizePhone(
        phone
      );

    if (
      phoneNormalized.length <
      8
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um telefone válido.",
        },
        {
          status: 400,
        }
      );
    }

    const businessVariants: Array<
      string | ObjectId
    > = [
      auth.businessId,
      auth.businessId.toString(),
    ];

    /*
    =====================================================
    VERIFICAR DUPLICIDADE
    =====================================================
    */

    let existing: any =
      await auth.db
        .collection("clients")
        .findOne({
          businessId: {
            $in:
              businessVariants,
          },

          phoneNormalized,
        });

    /*
    Compatibilidade com clientes antigos
    que talvez ainda não tenham phoneNormalized.
    */

    if (!existing) {
      const oldClients =
        await auth.db
          .collection("clients")
          .find({
            businessId: {
              $in:
                businessVariants,
            },
          })
          .project({
            name: 1,
            phone: 1,
            phoneNormalized: 1,
          })
          .toArray();

      existing =
        oldClients.find(
          (client) =>
            normalizePhone(
              String(
                client.phoneNormalized ||
                  client.phone ||
                  ""
              )
            ) ===
            phoneNormalized
        ) || null;
    }

    if (existing) {
      return NextResponse.json(
        {
          ok: false,

          message:
            "Este telefone já pertence a um cliente cadastrado.",

          existingClient: {
            _id:
              existing._id.toString(),

            name:
              String(
                existing.name ||
                  "Cliente"
              ),

            phone:
              String(
                existing.phone ||
                  phone
              ),
          },
        },
        {
          status: 409,
        }
      );
    }

    const now =
      new Date();

    const professionalId =
      auth.user.role ===
        "employee" &&
      auth.user.professionalId &&
      ObjectId.isValid(
        String(
          auth.user.professionalId
        )
      )
        ? new ObjectId(
            String(
              auth.user.professionalId
            )
          )
        : null;

    const client = {
      businessId:
        auth.businessId,

      businessSlug:
        auth.business.slug ||
        "",

      name,

      phone,

      phoneNormalized,

      email: "",

      notes: "",

      visitsCount: 0,
      totalVisits: 0,
      totalSpent: 0,

      firstVisitAt: null,
      lastVisitAt: null,
      lastVisit: null,

      active: true,

      createdByUserId:
        auth.user._id,

      createdByProfessionalId:
        professionalId,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await auth.db
        .collection("clients")
        .insertOne(
          client
        );

    return NextResponse.json(
      {
        ok: true,

        message:
          "Cliente cadastrado com sucesso.",

        client: {
          _id:
            result.insertedId.toString(),

          name,

          phone,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "BOOKING CLIENTS POST ERROR:",
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

function normalizePhone(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}
