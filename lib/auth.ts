import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
) {
  return bcrypt.compare(password, hashedPassword);
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error(
      "SESSION_SECRET não configurado no .env.local"
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(userId: string) {
  const secret = getSessionSecret();

  return new SignJWT({
    userId,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const secret = getSessionSecret();

    const { payload } = await jwtVerify(
      token,
      secret
    );

    const userId = payload.userId;

    if (
      !userId ||
      typeof userId !== "string"
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