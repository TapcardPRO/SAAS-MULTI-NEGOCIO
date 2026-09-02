import {
  Db,
} from "mongodb";

let indexPromise:
  Promise<void> | null =
  null;

export function ensureVelltoIndexes(
  db: Db
) {
  if (!indexPromise) {
    indexPromise =
      createIndexes(
        db
      ).catch(
        (error) => {
          console.error(
            "VELLTO INDEX ERROR:",
            error
          );

          /*
          Permite tentar novamente
          em outro request/cold start.
          */
          indexPromise =
            null;
        }
      );
  }

  return indexPromise;
}

async function createIndexes(
  db: Db
) {
  await Promise.all([
    db
      .collection(
        "appointments"
      )
      .createIndex({
        businessId: 1,
        professionalId: 1,
        date: 1,
        status: 1,
      }),

    db
      .collection(
        "appointments"
      )
      .createIndex({
        businessId: 1,
        clientId: 1,
        date: -1,
      }),

    db
      .collection(
        "appointments"
      )
      .createIndex({
        businessId: 1,
        date: 1,
        startMinutes: 1,
      }),

    db
      .collection(
        "clients"
      )
      .createIndex({
        businessId: 1,
        phoneNormalized: 1,
      }),

    db
      .collection(
        "memberships"
      )
      .createIndex({
        businessId: 1,
        clientId: 1,
        active: 1,
        paymentStatus: 1,
      }),

    db
      .collection(
        "membership_usages"
      )
      .createIndex({
        businessId: 1,
        membershipId: 1,
        createdAt: -1,
      }),

    db
      .collection(
        "expenses"
      )
      .createIndex({
        businessId: 1,
        date: 1,
        status: 1,
      }),

    db
      .collection(
        "booking_locks"
      )
      .createIndex({
        lockedUntil: 1,
      }),

    db
      .collection(
        "saas_subscriptions"
      )
      .createIndex(
        {
          businessId: 1,
        },
        {
          unique: true,
        }
      ),

    db
      .collection(
        "saas_subscriptions"
      )
      .createIndex({
        mercadoPagoSubscriptionId: 1,
      }),

    db
      .collection(
        "saas_billing_payments"
      )
      .createIndex(
        {
          externalId: 1,
        },
        {
          unique: true,
          sparse: true,
        }
      ),

    db
      .collection(
        "saas_billing_payments"
      )
      .createIndex({
        businessId: 1,
        createdAt: -1,
      }),
  ]);

  console.log(
    "Vellto: índices verificados."
  );
}
