import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export async function PUT(
  request: Request
) {
  try {
    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "saas_customer_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Cliente não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifyCustomerSessionToken(
        token
      );

    if (
      !session?.customerId ||
      !ObjectId.isValid(
        String(
          session.customerId
        )
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Sessão inválida",
        },
        {
          status: 401,
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

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const photoUrl =
      String(
        body.photoUrl || ""
      ).trim();

    if (
      name.length < 2
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um nome válido",
        },
        {
          status: 400,
        }
      );
    }

    const phoneNormalized =
      normalizePhone(phone);

    if (
      phoneNormalized.length <
      10
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um WhatsApp válido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email &&
      !email.includes("@")
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um e-mail válido",
        },
        {
          status: 400,
        }
      );
    }

    const db =
      await getDb();

    const customerId =
      new ObjectId(
        String(
          session.customerId
        )
      );

    const customer =
      await db
        .collection(
          "customer_accounts"
        )
        .findOne({
          _id: customerId,

          active: {
            $ne: false,
          },
        });

    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Conta não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const duplicatePhone =
      await db
        .collection(
          "customer_accounts"
        )
        .findOne({
          _id: {
            $ne: customerId,
          },

          phoneNormalized,
        });

    if (duplicatePhone) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este WhatsApp já está sendo utilizado por outra conta",
        },
        {
          status: 409,
        }
      );
    }

    if (email) {
      const duplicateEmail =
        await db
          .collection(
            "customer_accounts"
          )
          .findOne({
            _id: {
              $ne: customerId,
            },

            email,
          });

      if (duplicateEmail) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Este e-mail já está sendo utilizado por outra conta",
          },
          {
            status: 409,
          }
        );
      }
    }

    const now =
      new Date();

    await db
      .collection(
        "customer_accounts"
      )
      .updateOne(
        {
          _id: customerId,
        },
        {
          $set: {
            name,
            phone,
            phoneNormalized,
            email,
            photoUrl,
            updatedAt: now,
          },
        }
      );

    /*
    Atualiza também os cadastros
    locais de cliente ligados pelo
    telefone antigo, quando existirem.
    */

    const oldPhoneNormalized =
      String(
        customer.phoneNormalized ||
          ""
      );

    if (oldPhoneNormalized) {
      await db
        .collection("clients")
        .updateMany(
          {
            $or: [
              {
                phoneNormalized:
                  oldPhoneNormalized,
              },
              {
                phoneNorm:
                  oldPhoneNormalized,
              },
            ],
          },
          {
            $set: {
              name,
              phone,
              phoneNormalized,
              phoneNorm:
                phoneNormalized,
              email,
              updatedAt: now,
            },
          }
        );
    }

    return NextResponse.json({
      ok: true,

      message:
        "Perfil atualizado com sucesso",

      customer: {
        id:
          customerId.toString(),

        name,
        phone,
        phoneNormalized,
        email,
        photoUrl,
      },
    });
  } catch (error) {
    console.error(
      "CUSTOMER PROFILE UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar perfil",
      },
      {
        status: 500,
      }
    );
  }
}
