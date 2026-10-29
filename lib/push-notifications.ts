import webpush from "web-push";
import type { Db, ObjectId } from "mongodb";

type NewAppointmentNotice = {
  clientName: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
};

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendNewAppointmentPush(
  db: Db,
  businessId: ObjectId,
  notice: NewAppointmentNotice
) {
  if (!configureVapid()) return;

  const subscriptions = await db.collection("pushSubscriptions").find({
    $or: [
      { businessId },
      { businessId: businessId.toString() },
    ],
  }).toArray();

  const payload = JSON.stringify({
    title: "Novo agendamento · Vellto",
    body: `${notice.clientName} agendou ${notice.serviceName} para ${notice.date} às ${notice.time} com ${notice.professionalName}.`,
    url: "/dashboard/agenda",
    tag: `vellto-appointment-${Date.now()}`,
  });

  await Promise.all(subscriptions.map(async (item: any) => {
    try {
      await webpush.sendNotification(item.subscription, payload);
    } catch (error: any) {
      const statusCode = Number(error?.statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await db.collection("pushSubscriptions").deleteOne({ _id: item._id });
      } else {
        console.error("VELLTO PUSH SEND ERROR:", statusCode || error);
      }
    }
  }));
}
