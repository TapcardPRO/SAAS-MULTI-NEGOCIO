import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireBusinessSession } from "@/lib/tenant-auth";
import {
  comparePassword,
  hashPassword,
} from "@/lib/auth";

function fail(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status,
    }
  );
}

export async function GET() {
  try {
    const auth =
      await requireBusinessSession();

    if (!auth.ok) {
      return fail(
        auth.message,
        auth.status
      );
    }

    let plan = null;

    if (auth.business.plan) {
      plan = await auth.db
        .collection("saas_plans")
        .findOne({
          slug: String(
            auth.business.plan
          ),
        });
    }

    return NextResponse.json({
      ok: true,

      user: {
        id: auth.user._id.toString(),
        name: auth.user.name || "",
        email: auth.user.email || "",
        role:
          auth.user.role || "owner",
      },

      business: {
        id:
          auth.business._id.toString(),
        name:
          auth.business.name || "",
        slug:
          auth.business.slug || "",
        category:
          auth.business.category || "",
        description:
          auth.business.description || "",
        whatsapp:
          auth.business.whatsapp || "",
        instagram:
          auth.business.instagram || "",
        address:
          auth.business.address || "",
        plan:
          auth.business.plan || "",
        active:
          auth.business.active !==
          false,
      },

      plan: plan
        ? {
            id: plan._id.toString(),
            name:
              plan.name ||
              auth.business.plan ||
              "",
            slug:
              plan.slug ||
              auth.business.plan ||
              "",
            description:
              plan.description || "",
            price:
              Number(plan.price || 0),
            billingCycle:
              plan.billingCycle ||
              "monthly",
            maxProfessionals:
              Number(
                plan.maxProfessionals ||
                  0
              ),
            maxServices:
              Number(
                plan.maxServices || 0
              ),
            active:
              plan.active !== false,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar configurações:",
      error
    );

    return fail(
      "Erro ao carregar configurações",
      500
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    const auth =
      await requireBusinessSession();

    if (!auth.ok) {
      return fail(
        auth.message,
        auth.status
      );
    }

    const body =
      await request.json();

    const section = String(
      body.section || ""
    );

    /*
    =========================================
    DADOS DA EMPRESA
    =========================================
    */
    if (section === "business") {
      const name = String(
        body.name || ""
      ).trim();

      const category = String(
        body.category || ""
      ).trim();

      const description = String(
        body.description || ""
      ).trim();

      const whatsapp = String(
        body.whatsapp || ""
      ).trim();

      const instagram = String(
        body.instagram || ""
      ).trim();

      const address = String(
        body.address || ""
      ).trim();

      if (name.length < 2) {
        return fail(
          "Informe o nome da empresa"
        );
      }

      await auth.db
        .collection("businesses")
        .updateOne(
          {
            _id: auth.businessId,
          },
          {
            $set: {
              name,
              category,
              description,
              whatsapp,
              instagram,
              address,
              updatedAt:
                new Date(),
            },
          }
        );

      return NextResponse.json({
        ok: true,
        message:
          "Dados da empresa atualizados com sucesso",
      });
    }

    /*
    =========================================
    CONTA DO PROPRIETÁRIO
    =========================================
    */
    if (section === "account") {
      const name = String(
        body.name || ""
      ).trim();

      const email = String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

      if (name.length < 2) {
        return fail(
          "Informe seu nome"
        );
      }

      if (
        !email ||
        !email.includes("@")
      ) {
        return fail(
          "Informe um e-mail válido"
        );
      }

      const duplicate =
        await auth.db
          .collection("users")
          .findOne({
            email,
            _id: {
              $ne: auth.user._id,
            },
          });

      if (duplicate) {
        return fail(
          "Este e-mail já está sendo utilizado"
        );
      }

      await auth.db
        .collection("users")
        .updateOne(
          {
            _id: auth.user._id,
          },
          {
            $set: {
              name,
              email,
              updatedAt:
                new Date(),
            },
          }
        );

      return NextResponse.json({
        ok: true,
        message:
          "Dados da conta atualizados com sucesso",
      });
    }

    /*
    =========================================
    ALTERAR SENHA
    =========================================
    */
    if (section === "password") {
      const currentPassword =
        String(
          body.currentPassword ||
            ""
        );

      const newPassword =
        String(
          body.newPassword || ""
        );

      const confirmPassword =
        String(
          body.confirmPassword ||
            ""
        );

      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        return fail(
          "Preencha todos os campos da senha"
        );
      }

      if (
        newPassword.length < 8
      ) {
        return fail(
          "A nova senha deve ter pelo menos 8 caracteres"
        );
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return fail(
          "A confirmação da senha não confere"
        );
      }

      if (
        !auth.user.passwordHash
      ) {
        return fail(
          "Esta conta não possui senha configurada"
        );
      }

      const valid =
        await comparePassword(
          currentPassword,
          String(
            auth.user.passwordHash
          )
        );

      if (!valid) {
        return fail(
          "A senha atual está incorreta",
          401
        );
      }

      const passwordHash =
        await hashPassword(
          newPassword
        );

      await auth.db
        .collection("users")
        .updateOne(
          {
            _id: auth.user._id,
          },
          {
            $set: {
              passwordHash,
              updatedAt:
                new Date(),
            },
          }
        );

      return NextResponse.json({
        ok: true,
        message:
          "Senha alterada com sucesso",
      });
    }

    return fail(
      "Configuração inválida"
    );
  } catch (error) {
    console.error(
      "Erro ao salvar configurações:",
      error
    );

    return fail(
      "Erro ao salvar configurações",
      500
    );
  }
}
