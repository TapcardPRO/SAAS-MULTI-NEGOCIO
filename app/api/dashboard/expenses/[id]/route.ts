import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

import {
  isMonthClosed,
} from "@/lib/monthly-closing";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: NextRequest,
  { params }: Props
) {
  try {
    const auth =
      await requireOwnerSession();

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

    const {
      id,
    } = await params;

    if (
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Despesa inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const current =
      await auth.db
        .collection(
          "expenses"
        )
        .findOne({
          _id:
            new ObjectId(
              id
            ),

          $or:
            businessFilters(
              auth.businessId,
              auth.business.slug
            ),
        } as any);

    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Despesa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const description =
      String(
        body.description ||
          ""
      ).trim();

    const category =
      String(
        body.category ||
          "outros"
      ).trim();

    const amount =
      Number(
        body.amount
      );

    const date =
      String(
        body.date ||
          ""
      ).trim();

    const paymentMethod =
      String(
        body.paymentMethod ||
          "pix"
      ).trim();

    const status =
      String(
        body.status ||
          "paid"
      ).trim();

    const notes =
      String(
        body.notes ||
          ""
      ).trim();

    if (
      description.length <
      2
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe a descrição da despesa.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Informe um valor válido.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Data inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const currentClosed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        String(
          current.date ||
            ""
        )
      );

    const targetClosed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        date
      );

    if (
      currentClosed ||
      targetClosed
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este mês está fechado. Reabra o mês antes de alterar despesas.",
        },
        {
          status: 409,
        }
      );
    }

    await auth.db
      .collection(
        "expenses"
      )
      .updateOne(
        {
          _id:
            new ObjectId(
              id
            ),
        },
        {
          $set: {
            description,
            category,
            amount,
            date,
            paymentMethod,
            status,
            notes,

            updatedAt:
              new Date(),
          },
        }
      );

    return NextResponse.json({
      ok: true,

      message:
        "Despesa atualizada com sucesso.",

      expense: {
        _id:
          id,

        description,
        category,
        amount,
        date,
        paymentMethod,
        status,
        notes,
      },
    });
  } catch (error) {
    console.error(
      "PUT EXPENSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar despesa.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const auth =
      await requireOwnerSession();

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

    const {
      id,
    } = await params;

    if (
      !ObjectId.isValid(
        id
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Despesa inválida.",
        },
        {
          status: 400,
        }
      );
    }

    const current =
      await auth.db
        .collection(
          "expenses"
        )
        .findOne({
          _id:
            new ObjectId(
              id
            ),

          $or:
            businessFilters(
              auth.businessId,
              auth.business.slug
            ),
        } as any);

    if (!current) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Despesa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const closed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        String(
          current.date ||
            ""
        )
      );

    if (
      closed
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este mês está fechado. Reabra o mês antes de excluir despesas.",
        },
        {
          status: 409,
        }
      );
    }

    const result =
      await auth.db
        .collection(
          "expenses"
        )
        .deleteOne({
          _id:
            new ObjectId(
              id
            ),

          $or:
            businessFilters(
              auth.businessId,
              auth.business.slug
            ),
        } as any);

    if (
      result.deletedCount !==
      1
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Despesa não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      message:
        "Despesa excluída.",
    });
  } catch (error) {
    console.error(
      "DELETE EXPENSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao excluir despesa.",
      },
      {
        status: 500,
      }
    );
  }
}

function businessFilters(
  businessId: any,
  slug?: string
) {
  return [
    {
      businessId,
    },

    {
      businessId:
        String(
          businessId
        ),
    },

    ...(slug
      ? [
          {
            businessSlug:
              slug,
          },
        ]
      : []),
  ];
}
