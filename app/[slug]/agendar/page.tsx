import { cookies } from "next/headers";
import {
  notFound,
  redirect,
} from "next/navigation";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";
import BookingClient from "./BookingClient";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AgendarPage({
  params,
}: Props) {
  const { slug } = await params;

  const db = await getDb();

  /*
  =====================================================
  EMPRESA
  =====================================================
  */

  const business = await db
    .collection("businesses")
    .findOne({
      slug,

      active: {
        $ne: false,
      },
    });

  if (!business) {
    notFound();
  }

  /*
  =====================================================
  VERIFICAR LOGIN DO CLIENTE
  =====================================================
  */

  const cookieStore =
    await cookies();

  const token =
    cookieStore.get(
      "saas_customer_session"
    )?.value;

  if (!token) {
    redirect(
      `/${slug}/entrar`
    );
  }

  const session =
    await verifyCustomerSessionToken(
      token
    );

  if (
    !session?.customerId ||
    !ObjectId.isValid(
      session.customerId
    )
  ) {
    redirect(
      `/${slug}/entrar`
    );
  }

  const customer =
    await db
      .collection(
        "customer_accounts"
      )
      .findOne({
        _id: new ObjectId(
          session.customerId
        ),

        active: {
          $ne: false,
        },
      });

  if (!customer) {
    redirect(
      `/${slug}/entrar`
    );
  }

  /*
  =====================================================
  SERVIÇOS DA EMPRESA
  =====================================================
  */

  const services = await db
    .collection("services")
    .find({
      active: {
        $ne: false,
      },

      $or: [
        {
          businessId:
            business._id,
        },

        {
          businessId:
            business._id.toString(),
        },

        {
          businessSlug:
            slug,
        },
      ],
    })
    .sort({
      order: 1,
      createdAt: 1,
    })
    .toArray();

  /*
  =====================================================
  PROFISSIONAIS DA EMPRESA
  =====================================================
  */

  const professionals =
    await db
      .collection(
        "professionals"
      )
      .find({
        active: {
          $ne: false,
        },

        $or: [
          {
            businessId:
              business._id,
          },

          {
            businessId:
              business._id.toString(),
          },

          {
            businessSlug:
              slug,
          },
        ],
      })
      .sort({
        order: 1,
        createdAt: 1,
      })
      .toArray();

  /*
  =====================================================
  AGENDAMENTO
  =====================================================
  */

  return (
    <BookingClient
      business={{
        name: String(
          business.name || ""
        ),

        slug,

        logoUrl: String(
          business.logoUrl || ""
        ),

        primaryColor: String(
          business.primaryColor ||
            "#10b981"
        ),

        secondaryColor: String(
          business.secondaryColor ||
            "#0d1822"
        ),

        backgroundColor: String(
          business.backgroundColor ||
            "#071018"
        ),

        textColor: String(
          business.textColor ||
            "#ffffff"
        ),
      }}
      services={services.map(
        (service) => ({
          id:
            service._id.toString(),

          name: String(
            service.name || ""
          ),

          description: String(
            service.description ||
              ""
          ),

          price: Number(
            service.price || 0
          ),

          duration: Number(
            service.duration ||
              30
          ),

          photoUrl: String(
            service.photoUrl ||
              ""
          ),
        })
      )}
      professionals={professionals.map(
        (professional) => ({
          id:
            professional._id.toString(),

          name: String(
            professional.name ||
              ""
          ),

          role: String(
            professional.role ||
              ""
          ),

          photoUrl: String(
            professional.photoUrl ||
              ""
          ),

          serviceIds:
            Array.isArray(
              professional.serviceIds
            )
              ? professional.serviceIds.map(
                  (value: unknown) =>
                    String(value)
                )
              : [],
        })
      )}
    />
  );
}