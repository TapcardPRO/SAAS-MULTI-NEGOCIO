import {
  NextRequest,
  NextResponse,
} from "next/server";

import crypto from "crypto";

export async function GET(
  request: NextRequest
) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID;

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI;

  if (
    !clientId ||
    !redirectUri
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Google OAuth não está configurado.",
      },
      {
        status: 500,
      }
    );
  }

  const slug =
    request.nextUrl.searchParams.get(
      "slug"
    );

  if (!slug) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Empresa não informada.",
      },
      {
        status: 400,
      }
    );
  }

  const state =
    crypto
      .randomBytes(32)
      .toString("hex");

  const googleUrl =
    new URL(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );

  googleUrl.searchParams.set(
    "client_id",
    clientId
  );

  googleUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  googleUrl.searchParams.set(
    "response_type",
    "code"
  );

  googleUrl.searchParams.set(
    "scope",
    "openid email profile"
  );

  googleUrl.searchParams.set(
    "state",
    state
  );

  googleUrl.searchParams.set(
    "access_type",
    "offline"
  );

  googleUrl.searchParams.set(
    "prompt",
    "select_account"
  );

  const response =
    NextResponse.redirect(
      googleUrl.toString()
    );

  response.cookies.set(
    "google_oauth_state",
    state,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    }
  );

  response.cookies.set(
    "google_oauth_slug",
    slug,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    }
  );

  return response;
}