import {
  NextRequest,
  NextResponse,
} from "next/server";

import { ObjectId } from "mongodb";

import {
  comparePassword,
  hashPassword,
} from "@/lib/auth";

import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const auth =
      await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    let professional:
      any = null;

    if (
      auth.user.role ===
      "employee"
    ) {
      const professionalId =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          professionalId
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Profissional não vinculado ao usuário",
          },
          {
            status: 403,
          }
        );
      }

      professional =
        await auth.db
          .collection(
            "professionals"
          )
          .findOne({
            _id:
              new ObjectId(
                professionalId
              ),

            $or: [
              {
                businessId:
                  auth.businessId,
              },
              {
                businessId:
                  auth.businessId.toString(),
              },
            ],
          });
    }

    return NextResponse.json({
      ok: true,

      profile: {
        name:
          professional?.name ||
          auth.user.name ||
          "",

        email:
          auth.user.email ||
          "",

        phone:
          professional?.phone ||
          "",

        description:
          professional?.description ||
          "",

        photoUrl:
          professional?.photoUrl ||
          "",

        role:
          professional?.role ||
          "",

        commission:
          Number(
            professional?.commission ||
              0
          ),

        userRole:
          auth.user.role ||
          "owner",
      },
    });
  } catch (error) {
    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar perfil",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const auth =
      await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const body =
      await request.json();

    const name =
      String(
        body.name || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const description =
      String(
        body.description ||
          ""
      ).trim();

    const photoUrl =
      String(
        body.photoUrl ||
          ""
      ).trim();

    const currentPassword =
      String(
        body.currentPassword ||
          ""
      );

    const newPassword =
      String(
        body.newPassword ||
          ""
      );

    if (
      name.length < 2
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe seu nome.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um e-mail válido.",
        },
        {
          status: 400,
        }
      );
    }

    const emailInUse =
      await auth.db
        .collection("users")
        .findOne({
          email,

          _id: {
            $ne:
              auth.user._id,
          },
        });

    if (emailInUse) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este e-mail já está sendo usado por outro usuário.",
        },
        {
          status: 409,
        }
      );
    }

    const userUpdate:
      any = {
      name,
      email,
      updatedAt:
        new Date(),
    };

    if (newPassword) {
      if (
        newPassword.length <
        6
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "A nova senha deve ter pelo menos 6 caracteres.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !currentPassword
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Informe sua senha atual para criar uma nova senha.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !auth.user
          .passwordHash ||
        typeof auth.user
          .passwordHash !==
          "string"
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Não foi possível validar sua senha atual.",
          },
          {
            status: 400,
          }
        );
      }

      const passwordOk =
        await comparePassword(
          currentPassword,
          auth.user
            .passwordHash
        );

      if (!passwordOk) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Senha atual incorreta.",
          },
          {
            status: 400,
          }
        );
      }

      userUpdate.passwordHash =
        await hashPassword(
          newPassword
        );
    }

    await auth.db
      .collection("users")
      .updateOne(
        {
          _id:
            auth.user._id,
        },
        {
          $set:
            userUpdate,
        }
      );

    if (
      auth.user.role ===
      "employee"
    ) {
      const professionalId =
        String(
          auth.user.professionalId ||
            ""
        );

      if (
        !ObjectId.isValid(
          professionalId
        )
      ) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "Profissional não vinculado ao usuário",
          },
          {
            status: 403,
          }
        );
      }

      await auth.db
        .collection(
          "professionals"
        )
        .updateOne(
          {
            _id:
              new ObjectId(
                professionalId
              ),

            $or: [
              {
                businessId:
                  auth.businessId,
              },
              {
                businessId:
                  auth.businessId.toString(),
              },
            ],
          },
          {
            $set: {
              name,
              email,
              accessEmail:
                email,
              phone,
              description,
              photoUrl,
              updatedAt:
                new Date(),
            },
          }
        );
    }

    return NextResponse.json({
      ok: true,

      message:
        newPassword
          ? "Perfil e senha atualizados com sucesso."
          : "Perfil atualizado com sucesso.",

      profile: {
        name,
        email,
        phone,
        description,
        photoUrl,
      },
    });
  } catch (error) {
    console.error(
      "PUT PROFILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar perfil",
      },
      {
        status: 500,
      }
    );
  }
}
