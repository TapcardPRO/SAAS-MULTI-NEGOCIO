import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

/*
=========================================================
SENHAS
=========================================================
*/

export async function hashPassword(
  password: string
) {
  return bcrypt.hash(
    password,
    12
  );
}

export async function comparePassword(
  password: string,
  hashedPassword: string
) {
  return bcrypt.compare(
    password,
    hashedPassword
  );
}

/*
=========================================================
SECRET
=========================================================
*/

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET não configurado no .env.local"
    );
  }

  return new TextEncoder().encode(
    secret
  );
}

/*
=========================================================
SESSÃO DO PAINEL
OWNER / SUPERADMIN
=========================================================
*/

export async function createSessionToken(
  userId: string
) {
  const secret =
    getSessionSecret();

  return new SignJWT({
    userId,
    sessionType:
      "dashboard",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token: string
) {
  try {
    const secret =
      getSessionSecret();

    const { payload } =
      await jwtVerify(
        token,
        secret
      );

    const userId =
      payload.userId;

    if (
      !userId ||
      typeof userId !==
        "string"
    ) {
      return null;
    }

    /*
    Compatibilidade com tokens antigos:
    tokens anteriores não possuíam sessionType.
    */

    if (
      payload.sessionType &&
      payload.sessionType !==
        "dashboard"
    ) {
      return null;
    }

    return {
      userId,
    };
  } catch {
    return null;
  }
}

/*
=========================================================
SESSÃO DO CLIENTE FINAL
=========================================================
*/

export async function createCustomerSessionToken(
  customerId: string
) {
  const secret =
    getSessionSecret();

  return new SignJWT({
    customerId,

    sessionType:
      "customer",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyCustomerSessionToken(
  token: string
) {
  try {
    const secret =
      getSessionSecret();

    const { payload } =
      await jwtVerify(
        token,
        secret
      );

    if (
      payload.sessionType !==
      "customer"
    ) {
      return null;
    }

    const customerId =
      payload.customerId;

    if (
      !customerId ||
      typeof customerId !==
        "string"
    ) {
      return null;
    }

    return {
      customerId,
    };
  } catch {
    return null;
  }
}