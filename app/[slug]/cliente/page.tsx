import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";
import CustomerAreaClient from "./CustomerAreaClient";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CustomerAreaPage({
  params,
}: Props) {
  const { slug } = await params;

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
      String(
        session.customerId
      )
    )
  ) {
    redirect(
      `/${slug}/entrar`
    );
  }

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

  const customer =
    await db
      .collection(
        "customer_accounts"
      )
      .findOne({
        _id: new ObjectId(
          String(
            session.customerId
          )
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

  return (
    <CustomerAreaClient
      slug={slug}
    />
  );
}
