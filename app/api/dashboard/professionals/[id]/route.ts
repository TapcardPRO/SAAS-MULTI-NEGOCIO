import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const auth = await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        { message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: "Profissional inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const role = String(body.role || "").trim();
    const description = String(
      body.description || ""
    ).trim();

    const phone = String(body.phone || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const photoUrl = String(
      body.photoUrl || ""
    ).trim();

    const commission =
      body.commission === "" ||
      body.commission === undefined ||
      body.commission === null
        ? 0
        : Number(body.commission);

    const active = body.active !== false;

    const allowPanelAccess =
      body.allowPanelAccess === true;

    if (name.length < 2) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do profissional",
        },
        { status: 400 }
      );
    }

    if (
      email &&
      !email.includes("@")
    ) {
      return NextResponse.json(
        {
          message: "E-mail inválido",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(commission) ||
      commission < 0 ||
      commission > 100
    ) {
      return NextResponse.json(
        {
          message:
            "A comissão deve ficar entre 0% e 100%",
        },
        { status: 400 }
      );
    }

    const professionalId =
      new ObjectId(id);

    const professional =
      await auth.db
        .collection("professionals")
        .findOne({
          _id: professionalId,
          $or: [
            {
              businessId:
                auth.businessId,
            },
            {
              businessId:
                auth.businessId.toString(),
            },
            ...(auth.business.slug
              ? [
                  {
                    businessSlug:
                      auth.business.slug,
                  },
                ]
              : []),
          ],
        });

    if (!professional) {
      return NextResponse.json(
        {
          message:
            "Profissional não encontrado nesta empresa",
        },
        { status: 404 }
      );
    }

    await auth.db
      .collection("professionals")
      .updateOne(
        {
          _id: professionalId,
        },
        {
          $set: {
            name,
            role,
            description,
            phone,
            email,
            photoUrl,
            commission,
            active,
            allowPanelAccess,
            businessId:
              auth.businessId,
            businessSlug:
              auth.business.slug || "",
            updatedAt: new Date(),
          },
        }
      );

    return NextResponse.json({
      ok: true,
      message:
        "Profissional atualizado com sucesso",
      professional: {
        _id: id,
        name,
        role,
        description,
        phone,
        email,
        photoUrl,
        commission,
        active,
        allowPanelAccess,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar profissional:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao atualizar profissional",
      },
      { status: 500 }
    );
  }
}
