import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import {
  getDb,
} from "@/lib/db";

import {
  createCustomerSessionToken,
} from "@/lib/auth";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
};

export async function GET(
  request: NextRequest
) {
  try {
    const code =
      request.nextUrl.searchParams.get(
        "code"
      );

    const state =
      request.nextUrl.searchParams.get(
        "state"
      );

    const error =
      request.nextUrl.searchParams.get(
        "error"
      );

    const savedState =
      request.cookies.get(
        "google_oauth_state"
      )?.value;

    const slug =
      request.cookies.get(
        "google_oauth_slug"
      )?.value;

    /*
    =============================================
    CANCELAMENTO / ERRO DO GOOGLE
    =============================================
    */

    if (error) {
      return redirectToLogin(
        request,
        slug,
        "google_cancelled"
      );
    }

    /*
    =============================================
    VALIDAR DADOS DO CALLBACK
    =============================================
    */

    if (
      !code ||
      !state ||
      !savedState ||
      !slug
    ) {
      return redirectToLogin(
        request,
        slug,
        "google_invalid"
      );
    }

    /*
    Proteção contra CSRF.
    O state recebido precisa ser exatamente
    o mesmo criado antes de enviar o usuário
    para o Google.
    */

    if (state !== savedState) {
      return redirectToLogin(
        request,
        slug,
        "google_state"
      );
    }

    const clientId =
      process.env
        .GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env
        .GOOGLE_CLIENT_SECRET;

    const redirectUri =
      process.env
        .GOOGLE_REDIRECT_URI;

    if (
      !clientId ||
      !clientSecret ||
      !redirectUri
    ) {
      console.error(
        "GOOGLE OAUTH ENV NÃO CONFIGURADO"
      );

      return redirectToLogin(
        request,
        slug,
        "google_config"
      );
    }

    /*
    =============================================
    TROCAR CODE POR TOKEN
    =============================================
    */

    const tokenResponse =
      await fetch(
        "https://oauth2.googleapis.com/token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },

          body:
            new URLSearchParams({
              code,
              client_id:
                clientId,
              client_secret:
                clientSecret,
              redirect_uri:
                redirectUri,
              grant_type:
                "authorization_code",
            }),

          cache: "no-store",
        }
      );

    const tokenData =
      (await tokenResponse.json()) as
        GoogleTokenResponse;

    if (
      !tokenResponse.ok ||
      !tokenData.access_token
    ) {
      console.error(
        "GOOGLE TOKEN ERROR:",
        tokenData
      );

      return redirectToLogin(
        request,
        slug,
        "google_token"
      );
    }

    /*
    =============================================
    BUSCAR PERFIL NO GOOGLE
    =============================================
    */

    const profileResponse =
      await fetch(
        "https://openidconnect.googleapis.com/v1/userinfo",
        {
          headers: {
            Authorization:
              `Bearer ${tokenData.access_token}`,
          },

          cache: "no-store",
        }
      );

    const profile =
      (await profileResponse.json()) as
        GoogleProfile;

    if (
      !profileResponse.ok ||
      !profile.sub ||
      !profile.email
    ) {
      console.error(
        "GOOGLE PROFILE ERROR:",
        profile
      );

      return redirectToLogin(
        request,
        slug,
        "google_profile"
      );
    }

    /*
    =============================================
    EXIGIR E-MAIL VERIFICADO PELO GOOGLE
    =============================================
    */

    if (
      profile.email_verified !==
      true
    ) {
      return redirectToLogin(
        request,
        slug,
        "google_email"
      );
    }

    const googleId =
      profile.sub;

    const email =
      profile.email
        .trim()
        .toLowerCase();

    const name =
      String(
        profile.name ||
          profile.given_name ||
          email.split("@")[0]
      ).trim();

    const photoUrl =
      String(
        profile.picture || ""
      ).trim();

    const db =
      await getDb();

    const customers =
      db.collection(
        "customer_accounts"
      );

    const now =
      new Date();

    /*
    =============================================
    PROCURAR CONTA JÁ VINCULADA AO GOOGLE
    =============================================
    */

    let customer =
      await customers.findOne({
        googleId,
        active: {
          $ne: false,
        },
      });

    /*
    =============================================
    CONTA GOOGLE NOVA
    =============================================

    IMPORTANTE:
    Não vinculamos automaticamente uma conta
    existente apenas pelo e-mail, porque o
    cadastro por telefone ainda não possui
    verificação de e-mail.

    Isso evita que uma conta local seja ligada
    indevidamente somente porque alguém digitou
    aquele e-mail no cadastro.
    =============================================
    */

    if (!customer) {
      const result =
        await customers.insertOne({
          name,

          phone: "",

          phoneNormalized:
            "",

          email,

          passwordHash:
            null,

          authProviders: [
            "google",
          ],

          googleId,

          photoUrl,

          active:
            true,

          emailVerified:
            true,

          createdAt:
            now,

          updatedAt:
            now,

          lastLoginAt:
            now,
        });

      customer =
        await customers.findOne({
          _id:
            result.insertedId,
        });
    } else {
      /*
      =============================================
      ATUALIZAR DADOS DO GOOGLE
      =============================================
      */

      const providers =
        Array.isArray(
          customer.authProviders
        )
          ? customer.authProviders
          : [];

      const authProviders =
        providers.includes(
          "google"
        )
          ? providers
          : [
              ...providers,
              "google",
            ];

      await customers.updateOne(
        {
          _id:
            customer._id,
        },
        {
          $set: {
            name:
              customer.name ||
              name,

            email,

            photoUrl:
              photoUrl ||
              customer.photoUrl ||
              "",

            emailVerified:
              true,

            authProviders,

            updatedAt:
              now,

            lastLoginAt:
              now,
          },
        }
      );

      customer =
        await customers.findOne({
          _id:
            customer._id,
        });
    }

    if (
      !customer ||
      !(customer._id instanceof
        ObjectId)
    ) {
      return redirectToLogin(
        request,
        slug,
        "google_account"
      );
    }

    /*
    =============================================
    CRIAR SESSÃO DO CLIENTE
    =============================================
    */

    const token =
      await createCustomerSessionToken(
        customer._id.toString()
      );

    /*
    =============================================
    GOOGLE NORMALMENTE NÃO ENVIA TELEFONE

    Se a conta ainda não tem WhatsApp,
    vamos mandar para uma tela de completar
    cadastro antes do agendamento.
    =============================================
    */

    const phoneNormalized =
      String(
        customer.phoneNormalized ||
          ""
      ).replace(
        /\D/g,
        ""
      );

    const destination =
      phoneNormalized.length >= 10
        ? `/${slug}/agendar`
        : `/${slug}/completar-cadastro`;

    const response =
      NextResponse.redirect(
        new URL(
          destination,
          request.url
        )
      );

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
          60 *
          60 *
          24 *
          30,
      }
    );

    /*
    Apagar os cookies temporários do OAuth.
    */

    response.cookies.set(
      "google_oauth_state",
      "",
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge: 0,
      }
    );

    response.cookies.set(
      "google_oauth_slug",
      "",
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "GOOGLE CALLBACK ERROR:",
      error
    );

    return redirectToLogin(
      request,
      request.cookies.get(
        "google_oauth_slug"
      )?.value,
      "google_error"
    );
  }
}

function redirectToLogin(
  request: NextRequest,
  slug:
    | string
    | undefined,
  errorCode: string
) {
  const safeSlug =
    slug || "";

  const path =
    safeSlug
      ? `/${safeSlug}/entrar?error=${encodeURIComponent(
          errorCode
        )}`
      : "/";

  const response =
    NextResponse.redirect(
      new URL(
        path,
        request.url
      )
    );

  response.cookies.set(
    "google_oauth_state",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge: 0,
    }
  );

  response.cookies.set(
    "google_oauth_slug",
    "",
    {
      httpOnly: true,
      sameSite: "lax",
      secure:
        process.env.NODE_ENV ===
        "production",
      path: "/",
      maxAge: 0,
    }
  );

  return response;
}