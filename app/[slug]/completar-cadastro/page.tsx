import {
  cookies,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import {
  ObjectId,
} from "mongodb";

import {
  getDb,
} from "@/lib/db";

import {
  verifyCustomerSessionToken,
} from "@/lib/auth";

import CompleteProfileClient from "./CompleteProfileClient";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic =
  "force-dynamic";

export default async function CompleteProfilePage({
  params,
}: Props) {
  const {
    slug,
  } = await params;

  const db =
    await getDb();

  const business =
    await db
      .collection(
        "businesses"
      )
      .findOne({
        slug,
        active: {
          $ne: false,
        },
      });

  if (!business) {
    redirect("/");
  }

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

  if (!session) {
    redirect(
      `/${slug}/entrar`
    );
  }

  if (
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
        _id:
          new ObjectId(
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

  const phoneNormalized =
    String(
      customer.phoneNormalized ||
        ""
    ).replace(
      /\D/g,
      ""
    );

  /*
  Se o cliente já informou
  WhatsApp anteriormente,
  não precisa voltar para
  esta tela.
  */

  if (
    phoneNormalized.length >=
    10
  ) {
    redirect(
      `/${slug}/agendar`
    );
  }

  return (
    <CompleteProfileClient
      business={{
        name:
          String(
            business.name ||
              ""
          ),

        slug,

        logoUrl:
          String(
            business.logoUrl ||
              ""
          ),

        primaryColor:
          String(
            business.primaryColor ||
              "#10b981"
          ),
      }}

      customer={{
        name:
          String(
            customer.name ||
              ""
          ),

        email:
          String(
            customer.email ||
              ""
          ),

        photoUrl:
          String(
            customer.photoUrl ||
              ""
          ),
      }}
    />
  );
}