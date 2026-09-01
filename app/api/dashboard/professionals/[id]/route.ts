import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireOwnerSession } from "@/lib/tenant-auth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const auth =
      await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
          message: auth.message,
        },
        {
          status: auth.status,
        }
      );
    }

    const { id } =
      await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message:
            "Profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

    const body =
      await request.json();

    const name = String(
      body.name || ""
    ).trim();

    const role = String(
      body.role || ""
    ).trim();

    const description = String(
      body.description || ""
    ).trim();

    const phone = String(
      body.phone || ""
    ).trim();

    const email = String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

    const accessEmail = String(
      body.accessEmail ||
        body.email ||
        ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      body.password || ""
    );

    const photoUrl = String(
      body.photoUrl || ""
    ).trim();

    const commission =
      body.commission === "" ||
      body.commission ===
        undefined ||
      body.commission === null
        ? 0
        : Number(
            body.commission
          );

    const active =
      body.active !== false;

    const allowPanelAccess =
      body.allowPanelAccess ===
      true;

    if (name.length < 2) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do profissional",
        },
        {
          status: 400,
        }
      );
    }

    if (
      email &&
      !isValidEmail(email)
    ) {
      return NextResponse.json(
        {
          message:
            "E-mail do profissional inválido",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        commission
      ) ||
      commission < 0 ||
      commission > 100
    ) {
      return NextResponse.json(
        {
          message:
            "A comissão deve ficar entre 0% e 100%",
        },
        {
          status: 400,
        }
      );
    }

    if (
      allowPanelAccess &&
      !isValidEmail(
        accessEmail
      )
    ) {
      return NextResponse.json(
        {
          message:
            "Informe um e-mail de acesso válido",
        },
        {
          status: 400,
        }
      );
    }

    const professionalId =
      new ObjectId(id);

    const professional =
      await auth.db
        .collection(
          "professionals"
        )
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
            ...(auth.business
              .slug
              ? [
                  {
                    businessSlug:
                      auth.business
                        .slug,
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
        {
          status: 404,
        }
      );
    }

    let panelUser: any =
      null;

    if (
      professional.panelUserId &&
      ObjectId.isValid(
        String(
          professional.panelUserId
        )
      )
    ) {
      panelUser =
        await auth.db
          .collection("users")
          .findOne({
            _id: new ObjectId(
              String(
                professional.panelUserId
              )
            ),
          });
    }

    if (!panelUser) {
      panelUser =
        await auth.db
          .collection("users")
          .findOne({
            role: "employee",

            $or: [
              {
                professionalId:
                  professionalId,
              },
              {
                professionalId:
                  professionalId.toString(),
              },
            ],
          });
    }

    let panelUserId:
      | ObjectId
      | null =
      panelUser?._id || null;

    if (allowPanelAccess) {
      const emailOwner =
        await auth.db
          .collection("users")
          .findOne({
            email:
              accessEmail,
          });

      if (
        emailOwner &&
        (!panelUser ||
          String(
            emailOwner._id
          ) !==
            String(
              panelUser._id
            ))
      ) {
        return NextResponse.json(
          {
            message:
              "Este e-mail já está sendo usado por outro usuário.",
          },
          {
            status: 409,
          }
        );
      }

      if (!panelUser) {
        if (
          password.length < 6
        ) {
          return NextResponse.json(
            {
              message:
                "Crie uma senha inicial com pelo menos 6 caracteres.",
            },
            {
              status: 400,
            }
          );
        }

        const passwordHash =
          await hashPassword(
            password
          );

        const result =
          await auth.db
            .collection("users")
            .insertOne({
              name,
              email:
                accessEmail,

              passwordHash,

              role:
                "employee",

              businessId:
                auth.businessId,

              professionalId,

              active,

              createdAt:
                new Date(),

              updatedAt:
                new Date(),
            });

        panelUserId =
          result.insertedId;
      } else {
        const userUpdate: any =
          {
            name,

            email:
              accessEmail,

            role:
              "employee",

            businessId:
              auth.businessId,

            professionalId,

            active,

            updatedAt:
              new Date(),
          };

        if (password) {
          if (
            password.length <
            6
          ) {
            return NextResponse.json(
              {
                message:
                  "A nova senha deve ter pelo menos 6 caracteres.",
              },
              {
                status: 400,
              }
            );
          }

          userUpdate.passwordHash =
            await hashPassword(
              password
            );
        }

        await auth.db
          .collection("users")
          .updateOne(
            {
              _id:
                panelUser._id,
            },
            {
              $set:
                userUpdate,
            }
          );

        panelUserId =
          panelUser._id;
      }
    } else if (panelUser) {
      await auth.db
        .collection("users")
        .updateOne(
          {
            _id:
              panelUser._id,
          },
          {
            $set: {
              active: false,
              updatedAt:
                new Date(),
            },
          }
        );

      panelUserId =
        panelUser._id;
    }

    await auth.db
      .collection(
        "professionals"
      )
      .updateOne(
        {
          _id:
            professionalId,
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

            accessEmail:
              allowPanelAccess
                ? accessEmail
                : professional.accessEmail ||
                  "",

            panelUserId,

            businessId:
              auth.businessId,

            businessSlug:
              auth.business
                .slug || "",

            updatedAt:
              new Date(),
          },
        }
      );

    return NextResponse.json({
      ok: true,

      message:
        allowPanelAccess
          ? panelUser
            ? "Profissional e acesso ao painel atualizados."
            : "Profissional atualizado e acesso ao painel criado."
          : "Profissional atualizado com sucesso.",

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

        accessEmail:
          allowPanelAccess
            ? accessEmail
            : professional.accessEmail ||
              "",

        hasPanelUser:
          Boolean(
            panelUserId
          ),
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
      {
        status: 500,
      }
    );
  }
}

function isValidEmail(
  value: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}
