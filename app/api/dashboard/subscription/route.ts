import {
  NextResponse,
} from "next/server";

import {
  requireOwnerSession,
} from "@/lib/tenant-auth";

import {
  hasMercadoPagoConfig,
} from "@/lib/mercado-pago";

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

export async function GET() {
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

    const plan =
      await auth.db
        .collection(
          "saas_plans"
        )
        .findOne({
          slug:
            String(
              auth.business.plan ||
                "basico"
            ),
        });

    const payments =
      await auth.db
        .collection(
          "saas_billing_payments"
        )
        .find({
          businessId:
            auth.businessId,
        })
        .sort({
          createdAt: -1,
        })
        .limit(
          50
        )
        .toArray();

    return NextResponse.json({
      ok: true,

      configured:
        hasMercadoPagoConfig(),

      subscription: {
        businessId:
          String(
            auth.businessId
          ),

        plan:
          String(
            auth.business.plan ||
              "basico"
          ),

        planName:
          String(
            plan?.name ||
              auth.business.plan ||
              "Plano"
          ),

        price:
          Number(
            plan?.price ||
              0
          ),

        billingCycle:
          String(
            plan?.billingCycle ||
              "monthly"
          ),

        billingStatus:
          String(
            auth.business
              .billingStatus ||
              "active"
          ),

        trialEndsAt:
          formatDate(
            auth.business
              .trialEndsAt
          ),

        subscriptionEndsAt:
          formatDate(
            auth.business
              .subscriptionEndsAt
          ),

        mercadoPagoSubscriptionId:
          String(
            auth.business
              .mercadoPagoSubscriptionId ||
              ""
          ),
      },

      payments:
        payments.map(
          (payment) => ({
            id:
              String(
                payment._id
              ),

            externalId:
              String(
                payment.externalId ||
                  ""
              ),

            status:
              String(
                payment.status ||
                  ""
              ),

            amount:
              Number(
                payment.amount ||
                  0
              ),

            paidAt:
              payment.paidAt ||
              null,

            createdAt:
              payment.createdAt ||
              null,
          })
        ),
    });
  } catch (error) {
    console.error(
      "SUBSCRIPTION GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        message:
          "Erro ao carregar assinatura.",
      },
      {
        status: 500,
      }
    );
  }
}

function formatDate(
  value: unknown
) {
  if (!value) {
    return "";
  }

  if (
    value instanceof Date
  ) {
    return value
      .toISOString()
      .slice(
        0,
        10
      );
  }

  return String(
    value
  ).slice(
    0,
    10
  );
}
