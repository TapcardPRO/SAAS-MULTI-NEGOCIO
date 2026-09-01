import clientPromise from "@/lib/mongodb";

export async function getDb() {
  const client = await clientPromise;

  return client.db(
    process.env.DB_NAME || "saas_multi_negocio"
  );
}