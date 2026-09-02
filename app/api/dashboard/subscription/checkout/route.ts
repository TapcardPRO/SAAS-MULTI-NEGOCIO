import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

import {
  mercadoPagoRequest,
} from "@/lib/mercado-pago";

export const dynamic =
  "force-dynamic";

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
      await request
        .json()
        .catch(
          () => ({})
        );

    const requestedPlan =
      String(
        body.plan ||
          auth.business.plan ||
          ""
      ).trim();

    const plan =
      await auth.db
        .collection(
          "saas_plans"
        )
        .findOne({
          slug:
            requestedPlan,

          active: {
            $ne: false,
          },
        });

    if (!plan) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Plano Vellto não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const amount =
      Number(
        plan.price ||
          0
      );

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
            "Este plano não possui cobrança recorrente configurada.",
        },
        {
          status: 400,
        }
      );
    }

    const ownerEmail =
      String(
        auth.user.email ||
          ""
      )
        .trim()
        .toLowerCase();

    if (!ownerEmail) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "O usuário proprietário está sem e-mail.",
        },
        {
          status: 400,
        }
      );
    }

    const siteUrl =
      String(
        process.env
          .NEXT_PUBLIC_APP_URL ||
        process.env
          .APP_URL ||
        "https://velltoagenda.vercel.app"
      ).replace(
        /\/+$/,
        ""
      );

    const frequencyType =
      String(
        plan.billingCycle ||
          "monthly"
      ) ===
      "yearly"
        ? "months"
        : "months";

    const frequency =
      String(
        plan.billingCycle ||
          "monthly"
      ) ===
      "yearly"
        ? 12
        : 1;

    const externalReference =
      `vellto:${String(
        auth.businessId
      )}:${String(
        plan.slug
      )}`;

    const subscription =
      await mercadoPagoRequest(
        "/preapproval",
        {
          method:
            "POST",

          body: {
            reason:
              `Vellto Agenda - ${String(
                plan.name ||
                  "Assinatura"
              )}`,

            external_reference:
              externalReference,

            payer_email:
              ownerEmail,

            auto_recurring: {
              frequency,

              frequency_type:
                frequencyType,

              transaction_amount:
                amount,

              currency_id:
                "BRL",
            },

            back_url:
              `${siteUrl}/dashboard/assinatura`,

            status:
              "pending",
          },
        }
      );

    const now =
      new Date();

    await auth.db
      .collection(
        "businesses"
      )
      .updateOne(
        {
          _id:
            auth.businessId,
        },
        {
          $set: {
            plan:
              String(
                plan.slug
              ),

            mercadoPagoSubscriptionId:
              String(
                subscription.id ||
                  ""
              ),

            mercadoPagoCheckoutUrl:
              String(
                subscription.init_point ||
                  ""
              ),

            billingUpdatedAt:
              now,

            updatedAt:
              now,
          },
        }
      );

    await auth.db
      .collection(
        "saas_subscriptions"
      )
      .updateOne(
        {
          businessId:
            auth.businessId,
        },
        {
          $set: {
            businessId:
              auth.businessId,

            plan:
              String(
                plan.slug
              ),

            mercadoPagoSubscriptionId:
              String(
                subscription.id ||
                  ""
              ),

            externalReference,

            status:
              String(
                subscription.status ||
                  "pending"
              ),

            amount,

            billingCycle:
              String(
                plan.billingCycle ||
                  "monthly"
              ),

            checkoutUrl:
              String(
                subscription.init_point ||
                  ""
              ),

            updatedAt:
              now,
          },

          $setOnInsert: {
            createdAt:
              now,
          },
        },
        {
          upsert:
            true,
        }
      );

    const checkoutUrl =
      String(
        subscription.init_point ||
          ""
      );

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Mercado Pago criou a assinatura, mas não retornou o link de pagamento.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json({
      ok: true,

      checkoutUrl,

      subscriptionId:
        String(
          subscription.id ||
            ""
        ),
    });
  } catch (error) {
    console.error(
      "SUBSCRIPTION CHECKOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          error instanceof Error
            ? error.message
            : "Erro ao iniciar assinatura.",
      },
      {
        status: 500,
      }
    );
  }
}
