import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import {
  createCustomerSessionToken,
  hashPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request
) {
  try {
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

    const password = String(
      body.password || ""
    );

    /*
    =============================================
    VALIDAÇÕES
    =============================================
    */

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe seu nome.",
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
            "Informe um telefone válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      password.length < 8
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A senha precisa ter pelo menos 8 caracteres.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email &&
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um e-mail válido.",
        },
        {
          status: 400,
        }
      );
    }

    const db =
      await getDb();

    /*
    =============================================
    VERIFICAR TELEFONE JÁ CADASTRADO
    =============================================
    */

    const existingPhone =
      await db
        .collection(
          "customer_accounts"
        )
        .findOne({
          phoneNormalized,
        });

    if (existingPhone) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Já existe uma conta com este telefone.",
        },
        {
          status: 409,
        }
      );
    }

    /*
    =============================================
    VERIFICAR E-MAIL
    =============================================
    */

    if (email) {
      const existingEmail =
        await db
          .collection(
            "customer_accounts"
          )
          .findOne({
            email,
          });

      if (existingEmail) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Já existe uma conta com este e-mail.",
          },
          {
            status: 409,
          }
        );
      }
    }

    /*
    =============================================
    CRIAR CONTA
    =============================================
    */

    const passwordHash =
      await hashPassword(
        password
      );

    const now =
      new Date();

    const customer = {
      name,

      phone,

      phoneNormalized,

      email,

      passwordHash,

      authProviders: [
        "phone",
      ],

      googleId:
        null,

      photoUrl:
        "",

      active:
        true,

      createdAt:
        now,

      updatedAt:
        now,

      lastLoginAt:
        now,
    };

    const result =
      await db
        .collection(
          "customer_accounts"
        )
        .insertOne(
          customer
        );

    /*
    =============================================
    LOGIN AUTOMÁTICO
    =============================================
    */

    const token =
      await createCustomerSessionToken(
        result.insertedId.toString()
      );

    const response =
      NextResponse.json(
        {
          ok: true,

          message:
            "Conta criada com sucesso.",

          customer: {
            id:
              result.insertedId.toString(),

            name,

            phone,

            email,

            photoUrl:
              "",
          },
        },
        {
          status: 201,
        }
      );

    /*
    Sessão separada do painel administrativo.
    */

    response.cookies.set(
      "saas_customer_session",
      token,
      {
        httpOnly:
          true,

        sameSite:
          "lax",

        secure:
          process.env.NODE_ENV ===
          "production",

        path:
          "/",

        maxAge:
          60 *
          60 *
          24 *
          30,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "CUSTOMER REGISTER ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao criar conta.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
=============================================
HELPERS
=============================================
*/

function normalizePhone(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}