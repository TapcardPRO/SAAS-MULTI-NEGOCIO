import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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
          authenticated: false,
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
        session.customerId
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Sessão inválida",
        },
        {
          status: 401,
        }
      );
    }

    const db =
      await getDb();

    const customer =
      await db
        .collection(
          "customer_accounts"
        )
        .findOne({
          _id:
            new ObjectId(
              session.customerId
            ),
        });

    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Conta não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      customer.active === false
    ) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Conta bloqueada",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,

      customer: {
        id:
          customer._id.toString(),

        name:
          String(
            customer.name || ""
          ),

        phone:
          String(
            customer.phone || ""
          ),

        phoneNormalized:
          String(
            customer.phoneNormalized ||
              ""
          ),

        email:
          String(
            customer.email || ""
          ),

        photoUrl:
          String(
            customer.photoUrl || ""
          ),

        authProviders:
          Array.isArray(
            customer.authProviders
          )
            ? customer.authProviders
            : [],
      },
    });
  } catch (error) {
    console.error(
      "CUSTOMER ME ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        message:
          "Erro ao verificar conta",
      },
      {
        status: 500,
      }
    );
  }
}