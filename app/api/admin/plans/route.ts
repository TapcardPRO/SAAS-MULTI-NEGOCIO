import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireSuperAdmin } from "@/lib/superadmin";

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, message: auth.message },
        { status: auth.status }
      );
    }

    const plans = await auth.db
      .collection("saas_plans")
      .find({})
      .sort({ price: 1, createdAt: 1 })
      .toArray();

    const result = await Promise.all(
      plans.map(async (plan) => {
        const companies = await auth.db
          .collection("businesses")
          .countDocuments({
            plan: plan.slug,
          });

        return {
          id: plan._id.toString(),
          name: plan.name || "",
          slug: plan.slug || "",
          description: plan.description || "",
          price: Number(plan.price || 0),
          billingCycle: plan.billingCycle || "monthly",
          maxProfessionals: Number(
            plan.maxProfessionals || 0
          ),
          maxServices: Number(plan.maxServices || 0),
          active: plan.active !== false,
          companies,
          createdAt: plan.createdAt || null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      plans: result,
    });
  } catch (error) {
    console.error("Erro ao listar planos:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao listar planos",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const slug = createSlug(
      String(body.slug || body.name || "")
    );
    const description = String(
      body.description || ""
    ).trim();

    const price = Number(body.price || 0);
    const billingCycle =
      body.billingCycle === "yearly"
        ? "yearly"
        : "monthly";

    const maxProfessionals = Math.max(
      0,
      Number(body.maxProfessionals || 0)
    );

    const maxServices = Math.max(
      0,
      Number(body.maxServices || 0)
    );

    const active = body.active !== false;

    if (!name || !slug) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o nome do plano.",
        },
        { status: 400 }
      );
    }

    if (price < 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Preço inválido.",
        },
        { status: 400 }
      );
    }

    const existing = await auth.db
      .collection("saas_plans")
      .findOne({ slug });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Já existe um plano com esse identificador.",
        },
        { status: 409 }
      );
    }

    const now = new Date();

    const result = await auth.db
      .collection("saas_plans")
      .insertOne({
        name,
        slug,
        description,
        price,
        billingCycle,
        maxProfessionals,
        maxServices,
        active,
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.json(
      {
        ok: true,
        message: "Plano criado com sucesso",
        id: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar plano:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao criar plano",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperAdmin();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, message: auth.message },
        { status: auth.status }
      );
    }

    const body = await request.json();

    const id = String(body.id || "");

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Plano inválido",
        },
        { status: 400 }
      );
    }

    const existing = await auth.db
      .collection("saas_plans")
      .findOne({
        _id: new ObjectId(id),
      });

    if (!existing) {
      return NextResponse.json(
        {
          ok: false,
          message: "Plano não encontrado",
        },
        { status: 404 }
      );
    }

    const name = String(
      body.name ?? existing.name ?? ""
    ).trim();

    const description = String(
      body.description ??
        existing.description ??
        ""
    ).trim();

    const price = Number(
      body.price ?? existing.price ?? 0
    );

    const billingCycle =
      body.billingCycle === "yearly"
        ? "yearly"
        : "monthly";

    const maxProfessionals = Math.max(
      0,
      Number(
        body.maxProfessionals ??
          existing.maxProfessionals ??
          0
      )
    );

    const maxServices = Math.max(
      0,
      Number(
        body.maxServices ??
          existing.maxServices ??
          0
      )
    );

    const active =
      typeof body.active === "boolean"
        ? body.active
        : existing.active !== false;

    if (!name) {
      return NextResponse.json(
        {
          ok: false,
          message: "Informe o nome do plano.",
        },
        { status: 400 }
      );
    }

    await auth.db.collection("saas_plans").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          name,
          description,
          price,
          billingCycle,
          maxProfessionals,
          maxServices,
          active,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      ok: true,
      message: "Plano atualizado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Erro ao atualizar plano",
      },
      { status: 500 }
    );
  }
}
