import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  cookies,
} from "next/headers";

import {
  ObjectId,
} from "mongodb";

import {
  getDb,
} from "@/lib/db";

import {
  verifyCustomerSessionToken,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export async function POST(
  request: NextRequest
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
            "Você precisa estar logado.",
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
      !session ||
      !ObjectId.isValid(
        session.customerId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Sessão inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const phoneNormalized =
      normalizePhone(
        phone
      );

    if (
      phoneNormalized.length < 10
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um WhatsApp válido.",
        },
        {
          status: 400,
        }
      );
    }

    const db =
      await getDb();

    const customers =
      db.collection(
        "customer_accounts"
      );

    const customerId =
      new ObjectId(
        session.customerId
      );

    const customer =
      await customers.findOne({
        _id:
          customerId,

        active: {
          $ne: false,
        },
      });

    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Conta não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const existingPhone =
      await customers.findOne({
        phoneNormalized,

        _id: {
          $ne:
            customerId,
        },
      });

    if (existingPhone) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este WhatsApp já está vinculado a outra conta.",
        },
        {
          status: 409,
        }
      );
    }

    await customers.updateOne(
      {
        _id:
          customerId,
      },
      {
        $set: {
          phone,

          phoneNormalized,

          updatedAt:
            new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,

      message:
        "WhatsApp salvo com sucesso.",
    });
  } catch (error) {
    console.error(
      "COMPLETE PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao salvar cadastro.",
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