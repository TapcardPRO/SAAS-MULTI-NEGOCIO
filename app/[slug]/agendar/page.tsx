import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import BookingClient from "./BookingClient";

type Props = { params: Promise<{ slug: string }> };

export default async function AgendarPage({ params }: Props) {
  const { slug } = await params;
  const db = await getDb();
  const business = await db.collection("businesses").findOne({ slug, active: { $ne: false } });
  if (!business) notFound();

  const services = await db.collection("services").find({ businessSlug: slug, active: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray();
  const professionals = await db.collection("professionals").find({ businessSlug: slug, active: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray();

  return <BookingClient business={{ name: business.name || "", slug, logoUrl: business.logoUrl || "", primaryColor: business.primaryColor || "#22c55e" }} services={services.map((s) => ({ id: s._id.toString(), name: s.name || "", description: s.description || "", price: Number(s.price || 0), duration: Number(s.duration || 30), photoUrl: s.photoUrl || "" }))} professionals={professionals.map((p) => ({ id: p._id.toString(), name: p.name || "", role: p.role || "", photoUrl: p.photoUrl || "" }))} />;
}
