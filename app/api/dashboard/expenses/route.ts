import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

import {
  isMonthClosed,
} from "@/lib/monthly-closing";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest
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

    const url =
      new URL(
        request.url
      );

    const month =
      String(
        url.searchParams.get(
          "month"
        ) || ""
      ).trim();

    const filter: any = {
      $or:
        businessFilters(
          auth.businessId,
          auth.business.slug
        ),
    };

    if (
      /^\d{4}-\d{2}$/.test(
        month
      )
    ) {
      filter.date = {
        $gte:
          `${month}-01`,

        $lte:
          `${month}-31`,
      };
    }

    const expenses =
      await auth.db
        .collection(
          "expenses"
        )
        .find(
          filter
        )
        .sort({
          date: -1,
          createdAt: -1,
        })
        .toArray();

    return NextResponse.json({
      ok: true,

      expenses:
        expenses.map(
          serializeExpense
        ),
    });
  } catch (error) {
    console.error(
      "GET EXPENSES ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar despesas.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: NextRequest
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
            "Informe uma data válida.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "paid",
        "pending",
      ].includes(
        status
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Status da despesa inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const closed =
      await isMonthClosed(
        auth.db,
        auth.businessId,
        auth.business.slug,
        date
      );

    if (
      closed
    ) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Este mês está fechado. Reabra o mês antes de lançar novas despesas.",
        },
        {
          status: 409,
        }
      );
    }

    const now =
      new Date();

    const expense = {
      businessId:
        auth.businessId,

      businessSlug:
        auth.business.slug ||
        "",

      description,

      category,

      amount,

      date,

      paymentMethod,

      status,

      notes,

      createdAt:
        now,

      updatedAt:
        now,
    };

    const result =
      await auth.db
        .collection(
          "expenses"
        )
        .insertOne(
          expense
        );

    return NextResponse.json(
      {
        ok: true,

        message:
          "Despesa cadastrada com sucesso.",

        expense: {
          ...expense,

          _id:
            result.insertedId.toString(),
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST EXPENSE ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao cadastrar despesa.",
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

function serializeExpense(
  expense: any
) {
  return {
    _id:
      String(
        expense._id
      ),

    description:
      String(
        expense.description ||
          ""
      ),

    category:
      String(
        expense.category ||
          "outros"
      ),

    amount:
      Number(
        expense.amount ||
          0
      ),

    date:
      String(
        expense.date ||
          ""
      ),

    paymentMethod:
      String(
        expense.paymentMethod ||
          ""
      ),

    status:
      String(
        expense.status ||
          "paid"
      ),

    notes:
      String(
        expense.notes ||
          ""
      ),
  };
}
