import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { requireOwnerSession } from "@/lib/tenant-auth";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireOwnerSession();

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

    const filters: any[] = [
      {
        businessId: auth.businessId,
      },
      {
        businessId: auth.businessId.toString(),
      },
    ];

    if (auth.business.slug) {
      filters.push({
        businessSlug: auth.business.slug,
      });
    }

    const professionals = await auth.db
      .collection("professionals")
      .find({
        $or: filters,
      })
      .sort({
        order: 1,
        name: 1,
      })
      .toArray();

    return NextResponse.json({
      professionals: professionals.map(
        (professional) => ({
          _id: professional._id.toString(),

          name:
            professional.name ||
            "Profissional",

          role:
            professional.role || "",

          description:
            professional.description || "",

          photoUrl:
            professional.photoUrl || "",

          phone:
            professional.phone || "",

          email:
            professional.email || "",

          commission:
            Number(
              professional.commission || 0
            ),

          allowPanelAccess:
            professional.allowPanelAccess ===
            true,

          accessEmail:
            professional.accessEmail ||
            professional.email ||
            "",

          hasPanelUser:
            Boolean(
              professional.panelUserId
            ),

          active:
            professional.active !== false,

          order:
            professional.order || 0,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Erro em GET /api/dashboard/professionals:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao carregar profissionais",
      },
      {
        status: 500,
      }
    );
  }
}


export async function POST(
  request: Request
) {
  try {
    const auth =
      await requireOwnerSession();

    if (!auth.ok) {
      return NextResponse.json(
        {
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

    const role =
      String(
        body.role || ""
      ).trim();

    const description =
      String(
        body.description || ""
      ).trim();

    const phone =
      String(
        body.phone || ""
      ).trim();

    const email =
      String(
        body.email || ""
      )
        .trim()
        .toLowerCase();

    const photoUrl =
      String(
        body.photoUrl || ""
      ).trim();

    const commission =
      Number(
        body.commission || 0
      );

    const allowPanelAccess =
      body.allowPanelAccess ===
      true;

    const accessEmail =
      String(
        body.accessEmail ||
          email ||
          ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        body.password || ""
      );

    const active =
      body.active !== false;

    if (
      name.length < 2
    ) {
      return NextResponse.json(
        {
          message:
            "Informe o nome do profissional.",
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
            "A comissão deve estar entre 0 e 100%.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      allowPanelAccess
    ) {
      if (
        !accessEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          accessEmail
        )
      ) {
        return NextResponse.json(
          {
            message:
              "Informe um e-mail válido para acesso ao painel.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        password.length < 6
      ) {
        return NextResponse.json(
          {
            message:
              "A senha deve ter pelo menos 6 caracteres.",
          },
          {
            status: 400,
          }
        );
      }

      const existingUser =
        await auth.db
          .collection("users")
          .findOne({
            email:
              accessEmail,
          });

      if (
        existingUser
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
    }

    const now =
      new Date();

    const lastProfessional =
      await auth.db
        .collection(
          "professionals"
        )
        .find({
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
        })
        .sort({
          order: -1,
        })
        .limit(1)
        .toArray();

    const order =
      Number(
        lastProfessional[0]?.order ||
          0
      ) + 1;

    const professional = {
      businessId:
        auth.businessId,

      businessSlug:
        auth.business.slug ||
        "",

      name,

      role,

      description,

      phone,

      email,

      photoUrl,

      commission,

      allowPanelAccess,

      accessEmail:
        allowPanelAccess
          ? accessEmail
          : "",

      active,

      order,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await auth.db
        .collection(
          "professionals"
        )
        .insertOne(
          professional
        );

    let panelUserId =
      null;

    if (
      allowPanelAccess
    ) {
      const passwordHash =
        await hashPassword(
          password
        );

      const userResult =
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

            professionalId:
              result.insertedId,

            active,

            createdAt:
              now,

            updatedAt:
              now,
          });

      panelUserId =
        userResult.insertedId;

      await auth.db
        .collection(
          "professionals"
        )
        .updateOne(
          {
            _id:
              result.insertedId,
          },
          {
            $set: {
              panelUserId,
              updatedAt:
                now,
            },
          }
        );
    }

    return NextResponse.json(
      {
        message:
          "Profissional criado com sucesso.",

        professional: {
          _id:
            result.insertedId.toString(),

          name,

          role,

          description,

          phone,

          email,

          photoUrl,

          commission,

          allowPanelAccess,

          accessEmail:
            allowPanelAccess
              ? accessEmail
              : "",

          hasPanelUser:
            Boolean(
              panelUserId
            ),

          active,

          order,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro em POST /api/dashboard/professionals:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro interno ao criar profissional",
      },
      {
        status: 500,
      }
    );
  }
}
