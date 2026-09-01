import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import {
  comparePassword,
  createSessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(
      body.password || ""
    );

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe e-mail e senha",
        },
        {
          status: 400,
        }
      );
    }

    const db = await getDb();

    const user = await db
      .collection("users")
      .findOne({
        email,
      });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "E-mail ou senha inválidos",
        },
        {
          status: 401,
        }
      );
    }

    const passwordOk =
      await comparePassword(
        password,
        user.passwordHash
      );

    if (!passwordOk) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "E-mail ou senha inválidos",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * SUPER ADMIN
     */
    if (user.role === "superadmin") {
      if (user.active === false) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Seu acesso está bloqueado.",
          },
          {
            status: 403,
          }
        );
      }

      const token =
        await createSessionToken(
          user._id.toString()
        );

      const response =
        NextResponse.json({
          ok: true,
          message:
            "Login realizado com sucesso",

          user: {
            id: user._id.toString(),
            name: user.name || "",
            email: user.email || "",
            role: user.role,
          },
        });

      response.cookies.set(
        "saas_session",
        token,
        {
          httpOnly: true,
          sameSite: "lax",
          secure:
            process.env.NODE_ENV ===
            "production",
          path: "/",
          maxAge:
            60 * 60 * 24 * 7,
        }
      );

      return response;
    }

    /*
     * USUÁRIO NORMAL
     */
    if (user.active === false) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Seu acesso está bloqueado. Entre em contato com o administrador.",
        },
        {
          status: 403,
        }
      );
    }

    if (!user.businessId) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Sua conta não possui empresa vinculada.",
        },
        {
          status: 403,
        }
      );
    }

    const businessId = String(
      user.businessId
    );

    if (!ObjectId.isValid(businessId)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Empresa vinculada inválida.",
        },
        {
          status: 403,
        }
      );
    }

    const business = await db
      .collection("businesses")
      .findOne({
        _id: new ObjectId(businessId),
      });

    if (!business) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Empresa não encontrada.",
        },
        {
          status: 403,
        }
      );
    }

    if (business.active === false) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Esta empresa está bloqueada. Entre em contato com o administrador.",
        },
        {
          status: 403,
        }
      );
    }

    const token =
      await createSessionToken(
        user._id.toString()
      );

    const response =
      NextResponse.json({
        ok: true,
        message:
          "Login realizado com sucesso",

        user: {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email || "",
          role: user.role || "owner",
        },

        business: {
          id: business._id.toString(),
          name: business.name || "",
          slug: business.slug || "",
        },
      });

    response.cookies.set(
      "saas_session",
      token,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge:
          60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Erro no login:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao fazer login",
      },
      {
        status: 500,
      }
    );
  }
}