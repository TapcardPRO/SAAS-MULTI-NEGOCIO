import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("saas_session")?.value;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
        },
        {
          status: 401,
        }
      );
    }

    const session =
      await verifySessionToken(token);

    if (
      !session?.userId ||
      !ObjectId.isValid(session.userId)
    ) {
      return unauthorizedResponse();
    }

    const db = await getDb();

    const user = await db
      .collection("users")
      .findOne({
        _id: new ObjectId(
          session.userId
        ),
      });

    if (!user) {
      return unauthorizedResponse();
    }

    /*
     * Se o próprio usuário foi bloqueado,
     * derrubamos a sessão imediatamente.
     */
    if (user.active === false) {
      return blockedResponse(
        "Seu acesso está bloqueado."
      );
    }

    /*
     * SUPER ADMIN
     * Não precisa ter empresa vinculada.
     */
    if (user.role === "superadmin") {
      return NextResponse.json({
        ok: true,
        authenticated: true,

        user: {
          id: user._id.toString(),
          name: user.name || "",
          email: user.email || "",
          role: "superadmin",
        },

        business: null,
      });
    }

    /*
     * USUÁRIO DE EMPRESA
     */
    if (!user.businessId) {
      return blockedResponse(
        "Sua conta não possui empresa vinculada."
      );
    }

    const businessId = String(
      user.businessId
    );

    if (!ObjectId.isValid(businessId)) {
      return blockedResponse(
        "Empresa vinculada inválida."
      );
    }

    const business = await db
      .collection("businesses")
      .findOne({
        _id: new ObjectId(businessId),
      });

    if (!business) {
      return blockedResponse(
        "Empresa não encontrada."
      );
    }

    /*
     * Aqui fechamos o ponto importante:
     * mesmo que o cliente já estivesse
     * logado antes, se o Super Admin
     * bloquear a empresa, /api/auth/me
     * passa a negar a sessão.
     */
    if (business.active === false) {
      return blockedResponse(
        "Esta empresa está bloqueada. Entre em contato com o administrador."
      );
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,

      user: {
        id: user._id.toString(),
        name: user.name || "",
        email: user.email || "",
        role: user.role || "owner",
      },

      business: {
        id: business._id.toString(),
        slug: business.slug || "",
        name: business.name || "",
        plan:
          business.plan || "basico",
        active: true,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao verificar sessão:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        authenticated: false,
        message:
          "Erro ao verificar sessão",
      },
      {
        status: 500,
      }
    );
  }
}

function unauthorizedResponse() {
  const response =
    NextResponse.json(
      {
        ok: false,
        authenticated: false,
        message: "Sessão inválida",
      },
      {
        status: 401,
      }
    );

  response.cookies.set(
    "saas_session",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      expires: new Date(0),
    }
  );

  return response;
}

function blockedResponse(
  message: string
) {
  const response =
    NextResponse.json(
      {
        ok: false,
        authenticated: false,
        blocked: true,
        message,
      },
      {
        status: 403,
      }
    );

  /*
   * Apagamos a sessão.
   * Então o cliente bloqueado não fica
   * com um token válido no navegador.
   */
  response.cookies.set(
    "saas_session",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      expires: new Date(0),
    }
  );

  return response;
}