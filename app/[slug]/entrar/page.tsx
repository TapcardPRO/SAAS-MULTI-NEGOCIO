import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import CustomerAuthClient from "./CustomerAuthClient";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EntrarPage({
  params,
}: Props) {
  const { slug } = await params;

  const db = await getDb();

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

  return (
    <CustomerAuthClient
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
      }}
    />
  );
}