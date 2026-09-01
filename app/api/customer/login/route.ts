import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  comparePassword,
  createCustomerSessionToken,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const phone = String(
      body.phone || ""
    ).trim();

    const password = String(
      body.password || ""
    );

    const phoneNormalized =
      normalizePhone(phone);

    if (
      phoneNormalized.length < 10
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

    if (!password) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe sua senha.",
        },
        {
          status: 400,
        }
      );
    }

    const db = await getDb();

    const customer = await db
      .collection("customer_accounts")
      .findOne({
        phoneNormalized,
      });

    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Telefone ou senha incorretos.",
        },
        {
          status: 401,
        }
      );
    }

    if (
      customer.active === false
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta conta está bloqueada.",
        },
        {
          status: 403,
        }
      );
    }

    if (!customer.passwordHash) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta conta utiliza login com Google.",
        },
        {
          status: 400,
        }
      );
    }

    const passwordValid =
      await comparePassword(
        password,
        String(
          customer.passwordHash
        )
      );

    if (!passwordValid) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Telefone ou senha incorretos.",
        },
        {
          status: 401,
        }
      );
    }

    const token =
      await createCustomerSessionToken(
        customer._id.toString()
      );

    const now = new Date();

    await db
      .collection("customer_accounts")
      .updateOne(
        {
          _id: customer._id,
        },
        {
          $set: {
            lastLoginAt: now,
            updatedAt: now,
          },
        }
      );

    const response =
      NextResponse.json({
        ok: true,

        message:
          "Login realizado com sucesso.",

        customer: {
          id:
            customer._id.toString(),

          name: String(
            customer.name || ""
          ),

          phone: String(
            customer.phone || ""
          ),

          email: String(
            customer.email || ""
          ),

          photoUrl: String(
            customer.photoUrl || ""
          ),
        },
      });

    response.cookies.set(
      "saas_customer_session",
      token,
      {
        httpOnly: true,
        sameSite: "lax",

        secure:
          process.env.NODE_ENV ===
          "production",

        path: "/",

        maxAge:
          60 * 60 * 24 * 30,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "CUSTOMER LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao realizar login.",
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
