import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ObjectId,
} from "mongodb";

import {
  getDb,
} from "@/lib/db";

import {
  mapSubscriptionStatus,
  mercadoPagoRequest,
} from "@/lib/mercado-pago";

export const dynamic =
  "force-dynamic";

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request
        .json()
        .catch(
          () => ({})
        );

    const type =
      String(
        body.type ||
        body.topic ||
        ""
      );

    const dataId =
      String(
        body.data?.id ||
        body.id ||
        ""
      );

    if (!dataId) {
      return NextResponse.json({
        ok: true,
        ignored: true,
      });
    }

    /*
    O simulador do Mercado Pago envia IDs fictícios
    como "123456". Esses IDs não existem na API real.

    Para o teste do painel, confirmamos o recebimento
    sem tentar consultar uma assinatura inexistente.
    */
    const isMercadoPagoSimulator =
      dataId === "123456" &&
      String(body.application_id || "") !== "";

    if (isMercadoPagoSimulator) {
      console.log(
        "MERCADO PAGO WEBHOOK TEST RECEIVED:",
        {
          type,
          dataId,
          action: body.action || "",
        }
      );

      return NextResponse.json({
        ok: true,
        simulated: true,
      });
    }

    const db =
      await getDb();

    if (
      type ===
        "subscription_preapproval"
    ) {
      const subscription =
        await mercadoPagoRequest(
          `/preapproval/${encodeURIComponent(
            dataId
          )}`
        );

      const externalReference =
        String(
          subscription.external_reference ||
            ""
        );

      const parsed =
        parseExternalReference(
          externalReference
        );

      if (!parsed) {
        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      const businessId =
        new ObjectId(
          parsed.businessId
        );

      const billingStatus =
        mapSubscriptionStatus(
          subscription.status
        );

      const now =
        new Date();

      await db
        .collection(
          "businesses"
        )
        .updateOne(
          {
            _id:
              businessId,
          },
          {
            $set: {
              billingStatus,

              plan:
                parsed.plan,

              mercadoPagoSubscriptionId:
                String(
                  subscription.id ||
                    ""
                ),

              billingUpdatedAt:
                now,

              updatedAt:
                now,
            },
          }
        );

      await db
        .collection(
          "saas_subscriptions"
        )
        .updateOne(
          {
            businessId,
          },
          {
            $set: {
              businessId,

              plan:
                parsed.plan,

              mercadoPagoSubscriptionId:
                String(
                  subscription.id ||
                    ""
                ),

              externalReference,

              status:
                String(
                  subscription.status ||
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
    }

    if (
      type ===
        "subscription_authorized_payment"
    ) {
      const payment =
        await mercadoPagoRequest(
          `/authorized_payments/${encodeURIComponent(
            dataId
          )}`
        );

      const subscriptionId =
        String(
          payment.preapproval_id ||
          payment.subscription_id ||
          ""
        );

      if (!subscriptionId) {
        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      const storedSubscription =
        await db
          .collection(
            "saas_subscriptions"
          )
          .findOne({
            mercadoPagoSubscriptionId:
              subscriptionId,
          });

      if (!storedSubscription) {
        return NextResponse.json({
          ok: true,
          ignored: true,
        });
      }

      const businessId =
        storedSubscription
          .businessId;

      const status =
        String(
          payment.status ||
            ""
        );

      const approved =
        status ===
          "approved" ||
        status ===
          "authorized";

      const now =
        new Date();

      await db
        .collection(
          "saas_billing_payments"
        )
        .updateOne(
          {
            externalId:
              String(
                payment.id
              ),
          },
          {
            $set: {
              businessId,

              subscriptionId,

              externalId:
                String(
                  payment.id
                ),

              status,

              amount:
                Number(
                  payment.transaction_amount ||
                    payment.amount ||
                    0
                ),

              paidAt:
                approved
                  ? now
                  : null,

              rawUpdatedAt:
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

      await db
        .collection(
          "businesses"
        )
        .updateOne(
          {
            _id:
              businessId,
          },
          {
            $set: {
              billingStatus:
                approved
                  ? "active"
                  : "past_due",

              billingUpdatedAt:
                now,

              updatedAt:
                now,
            },
          }
        );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "MERCADO PAGO WEBHOOK ERROR:",
      error
    );

    /*
    Retorna erro para que o provedor
    possa tentar reenviar.
    */
    return NextResponse.json(
      {
        ok: false,
      },
      {
        status: 500,
      }
    );
  }
}

function parseExternalReference(
  value: string
) {
  const match =
    /^vellto:([a-f0-9]{24}):(.+)$/i.exec(
      value
    );

  if (
    !match ||
    !ObjectId.isValid(
      match[1]
    )
  ) {
    return null;
  }

  return {
    businessId:
      match[1],

    plan:
      match[2],
  };
}
