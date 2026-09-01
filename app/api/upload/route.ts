import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import crypto from "crypto";

import { getDb } from "@/lib/db";
import {
  verifySessionToken,
  verifyCustomerSessionToken,
} from "@/lib/auth";

async function requireAuthenticatedUser() {
  const cookieStore = await cookies();

  const dashboardToken =
    cookieStore.get("saas_session")?.value;

  const customerToken =
    cookieStore.get("saas_customer_session")?.value;

  const db = await getDb();

  if (dashboardToken) {
    const session =
      await verifySessionToken(dashboardToken);

    if (
      session?.userId &&
      ObjectId.isValid(session.userId)
    ) {
      const user = await db
        .collection("users")
        .findOne({
          _id: new ObjectId(session.userId),
          active: { $ne: false },
        });

      if (user) {
        return {
          ok: true as const,
          type: "dashboard" as const,
        };
      }
    }
  }

  if (customerToken) {
    const session =
      await verifyCustomerSessionToken(
        customerToken
      );

    if (
      session?.customerId &&
      ObjectId.isValid(session.customerId)
    ) {
      const customer = await db
        .collection("customer_accounts")
        .findOne({
          _id: new ObjectId(
            session.customerId
          ),
          active: { $ne: false },
        });

      if (customer) {
        return {
          ok: true as const,
          type: "customer" as const,
        };
      }
    }
  }

  return {
    ok: false as const,
  };
}

export async function POST(
  request: Request
) {
  try {
    const auth =
      await requireAuthenticatedUser();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Você precisa estar autenticado para enviar imagens.",
        },
        {
          status: 401,
        }
      );
    }

    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME;

    const apiKey =
      process.env.CLOUDINARY_API_KEY;

    const apiSecret =
      process.env.CLOUDINARY_API_SECRET;

    if (
      !cloudName ||
      !apiKey ||
      !apiSecret
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Serviço de imagens não configurado.",
        },
        {
          status: 500,
        }
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Nenhuma imagem foi enviada",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !file.type.startsWith("image/")
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "O arquivo precisa ser uma imagem",
        },
        {
          status: 400,
        }
      );
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "A imagem deve ter no máximo 10 MB",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Não usamos diretamente a pasta
     * enviada pelo navegador.
     *
     * Assim evitamos que alguém escolha
     * qualquer pasta da Cloudinary.
     */
    const requestedFolder =
      String(
        formData.get("folder") || ""
      );

    let folder =
      "vellto-agenda/uploads";

    if (auth.type === "customer") {
      folder =
        "vellto-agenda/clientes";
    } else if (
      requestedFolder.includes(
        "servic"
      )
    ) {
      folder =
        "vellto-agenda/servicos";
    } else if (
      requestedFolder.includes(
        "prof"
      )
    ) {
      folder =
        "vellto-agenda/profissionais";
    } else if (
      requestedFolder.includes(
        "galer"
      )
    ) {
      folder =
        "vellto-agenda/galeria";
    } else {
      folder =
        "vellto-agenda/empresas";
    }

    const timestamp =
      Math.floor(Date.now() / 1000);

    const stringToSign =
      `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

    const signature = crypto
      .createHash("sha1")
      .update(stringToSign)
      .digest("hex");

    const uploadData =
      new FormData();

    uploadData.append(
      "file",
      file
    );

    uploadData.append(
      "api_key",
      apiKey
    );

    uploadData.append(
      "timestamp",
      String(timestamp)
    );

    uploadData.append(
      "folder",
      folder
    );

    uploadData.append(
      "signature",
      signature
    );

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Cloudinary:",
        result
      );

      return NextResponse.json(
        {
          ok: false,
          message:
            result?.error?.message ||
            "Erro ao enviar a imagem",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error(
      "Erro no upload:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro interno ao enviar imagem",
      },
      {
        status: 500,
      }
    );
  }
}
