import { Db, ObjectId } from "mongodb";

export type DaySchedule = { open: boolean; start: string; end: string };
export type WorkingHours = Record<string, DaySchedule>;

export const DEFAULT_WORKING_HOURS: WorkingHours = {
  sunday: { open: false, start: "09:00", end: "14:00" },
  monday: { open: true, start: "09:00", end: "19:00" },
  tuesday: { open: true, start: "09:00", end: "19:00" },
  wednesday: { open: true, start: "09:00", end: "19:00" },
  thursday: { open: true, start: "09:00", end: "19:00" },
  friday: { open: true, start: "09:00", end: "19:00" },
  saturday: { open: true, start: "09:00", end: "18:00" },
};

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const BUSY_STATUSES = ["pendente", "confirmado", "em_atendimento", "concluido"];

export function normalizePhone(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

export function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function normalizeWorkingHours(value: unknown): WorkingHours {
  const source = value && typeof value === "object" ? (value as Record<string, any>) : {};
  const result: WorkingHours = {};

  for (const [day, fallback] of Object.entries(DEFAULT_WORKING_HOURS)) {
    const current = source[day];
    result[day] = {
      open: typeof current?.open === "boolean" ? current.open : fallback.open,
      start: /^\d{2}:\d{2}$/.test(current?.start || "") ? current.start : fallback.start,
      end: /^\d{2}:\d{2}$/.test(current?.end || "") ? current.end : fallback.end,
    };
  }

  return result;
}

export async function getEligibleProfessionals(db: Db, businessId: ObjectId, serviceId: ObjectId) {
  const professionals = await db.collection("professionals").find({
    businessId: { $in: [businessId, businessId.toString()] },
    active: { $ne: false },
  }).sort({ order: 1, createdAt: 1 }).toArray();

  if (professionals.length > 0) {
    return professionals.filter((p) => {
      if (!Array.isArray(p.serviceIds) || p.serviceIds.length === 0) return true;
      return p.serviceIds.map(String).includes(serviceId.toString());
    });
  }

  // Compatibilidade com documentos antigos que ainda usam businessSlug.
  const business = await db.collection("businesses").findOne({ _id: businessId });
  if (!business?.slug) return [];
  const legacy = await db.collection("professionals").find({ businessSlug: business.slug, active: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray();
  return legacy.filter((p) => !Array.isArray(p.serviceIds) || p.serviceIds.length === 0 || p.serviceIds.map(String).includes(serviceId.toString()));
}

export async function computeAvailability(db: Db, args: {
  businessId: ObjectId;
  professionalId: ObjectId;
  serviceId: ObjectId;
  date: string;
}) {
  const { businessId, professionalId, serviceId, date } = args;
  const business = await db.collection("businesses").findOne({ _id: businessId });
  const service = await db.collection("services").findOne({ _id: serviceId });
  const professional = await db.collection("professionals").findOne({ _id: professionalId });

  if (!business || !service || !professional) return { slots: [], duration: 0 };

  const duration = Math.max(5, Number(service.duration || 30));
  const dateObj = new Date(`${date}T12:00:00`);
  if (Number.isNaN(dateObj.getTime())) return { slots: [], duration };
  const dayKey = DAY_KEYS[dateObj.getDay()];

  const businessHours = normalizeWorkingHours(business.workingHours);
  const base = businessHours[dayKey];
  if (!base?.open) return { slots: [], duration };

  let start = toMinutes(base.start);
  let end = toMinutes(base.end);

  if (professional.workingHours) {
    const professionalHours = normalizeWorkingHours(professional.workingHours);
    const pday = professionalHours[dayKey];
    if (!pday?.open) return { slots: [], duration };
    start = Math.max(start, toMinutes(pday.start));
    end = Math.min(end, toMinutes(pday.end));
  }

  const appointments = await db.collection("appointments").find({
    businessId,
    professionalId,
    date,
    status: { $in: BUSY_STATUSES },
  }).toArray();

  const busy = appointments.map((a) => {
    const s = typeof a.startMinutes === "number" ? a.startMinutes : toMinutes(String(a.time || "00:00"));
    const e = typeof a.endMinutes === "number" ? a.endMinutes : s + Number(a.duration || 30);
    return [s, e] as [number, number];
  });

  const slots: string[] = [];
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let t = start; t + duration <= end; t += 15) {
    if (date === today && t <= currentMinutes) continue;
    if (!busy.some(([bs, be]) => t < be && t + duration > bs)) slots.push(toHHMM(t));
  }

  return { slots, duration };
}
