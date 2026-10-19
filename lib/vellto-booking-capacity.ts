// Quantidade de clientes simultaneos que um profissional pode atender.
// Registros antigos sem configuracao continuam tendo UMA vaga.
export const MAX_BOOKING_CAPACITY = 30;

export function parseBookingCapacity(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return 1;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= MAX_BOOKING_CAPACITY ? n : null;
}

export function normalizeBookingCapacity(value: unknown): number {
  return parseBookingCapacity(value) ?? 1;
}

type Interval = { start: number; end: number };

// Capacidade individual (1): usa sobreposicao de intervalos.
// Capacidade coletiva (>1): usa o numero de reservas da mesma hora de inicio.
export function remainingCapacityForInterval(
  existing: Interval[], start: number, end: number, rawCapacity: unknown
): number {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const capacity = normalizeBookingCapacity(rawCapacity);

  // Para sessoes coletivas, a capacidade pertence a HORA DE INICIO da reserva.
  // Ex.: 6 vagas as 14:00 => dois agendamentos das 14h deixam 4 vagas;
  // a sessao das 15:00 permanece com 6, mesmo que o servico dure 40 minutos.
  // Reservas antigas iniciadas as 14:15 ou 14:30 ocupam uma vaga das 14h.
  if (capacity > 1) {
    const sessionHour = Math.floor(start / 60);
    const booked = existing.filter((appointment) =>
      Number.isFinite(appointment.start) &&
      Math.floor(appointment.start / 60) === sessionHour
    ).length;
    return Math.max(0, capacity - booked);
  }

  // Para 1 vaga, preservar a regra original de sobreposicao por duracao.
  const events: { at: number; delta: number }[] = [];
  for (const interval of existing) {
    if (!Number.isFinite(interval.start) || !Number.isFinite(interval.end)) continue;
    if (interval.start >= end || interval.end <= start) continue;
    events.push({ at: Math.max(start, interval.start), delta: 1 });
    events.push({ at: Math.min(end, interval.end), delta: -1 });
  }
  // Terminacoes liberam a vaga antes de novos inicios no mesmo instante.
  events.sort((a, b) => a.at - b.at || a.delta - b.delta);
  let simultaneous = 0;
  let peak = 0;
  for (const event of events) {
    simultaneous += event.delta;
    peak = Math.max(peak, simultaneous);
  }
  return Math.max(0, capacity - peak);
}

export function hasCapacityForInterval(
  existing: Interval[], start: number, end: number, capacity: unknown
): boolean {
  return remainingCapacityForInterval(existing, start, end, capacity) > 0;
}
