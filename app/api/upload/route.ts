import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          ok: false,
          message: "Cloudinary não configurado no .env.local",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const folder =
      (formData.get("folder") as string | null) || "saas-multi-negocio";

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          message: "Nenhuma imagem foi enviada",
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          ok: false,
          message: "O arquivo precisa ser uma imagem",
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          ok: false,
          message: "A imagem deve ter no máximo 10 MB",
        },
        { status: 400 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const stringToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;

    const signature = crypto
      .createHash("sha1")
      .update(stringToSign)
      .digest("hex");

    const uploadData = new FormData();

    uploadData.append("file", file);
    uploadData.append("api_key", apiKey);
    uploadData.append("timestamp", String(timestamp));
    uploadData.append("folder", folder);
    uploadData.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Cloudinary:", result);

      return NextResponse.json(
        {
          ok: false,
          message:
            result?.error?.message ||
            "Erro ao enviar a imagem para o Cloudinary",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Erro no upload:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro interno ao enviar imagem",
      },
      { status: 500 }
    );
  }
}