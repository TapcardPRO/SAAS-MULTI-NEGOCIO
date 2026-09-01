import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireBusinessSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = [
  "pendente",
  "confirmado",
  "em_atendimento",
  "concluido",
  "cancelado",
  "faltou",
];

export async function PUT(
  request: Request,
  { params }: Props
) {
  try {
    const auth = await requireBusinessSession();

    if (!auth.ok) {
      return NextResponse.json(
        { ok: false, message: auth.message },
        { status: auth.status }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { ok: false, message: "Agendamento inválido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const status = String(body.status || "").trim();

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, message: "Status inválido" },
        { status: 400 }
      );
    }

    const appointmentId = new ObjectId(id);

    const businessIdString = String(auth.businessId);

    const businessFilter: any = ObjectId.isValid(
      businessIdString
    )
      ? {
          $in: [
            businessIdString,
            new ObjectId(businessIdString),
          ],
        }
      : {
          $in: [businessIdString],
        };

    const appointment = await auth.db
      .collection("appointments")
      .findOne({
        _id: appointmentId,
        businessId: businessFilter,
      } as any);

    if (!appointment) {
      return NextResponse.json(
        {
          ok: false,
          message: "Agendamento não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    const now = new Date();

    await auth.db
      .collection("appointments")
      .updateOne(
        { _id: appointmentId },
        {
          $set: {
            status,
            updatedAt: now,
            ...(status === "concluido"
              ? {
                  completedAt:
                    appointment.completedAt || now,
                }
              : {}),
          },
        }
      );

    if (status !== "concluido") {
      return NextResponse.json({
        ok: true,
        message: "Agendamento atualizado",
      });
    }

    /*
    =============================================
    CONTABILIZAR VISITA
    =============================================
    */

    if (
      appointment.clientId &&
      appointment.countedInClient !== true
    ) {
      const clientIdString = String(
        appointment.clientId
      );

      const clientFilter: any = ObjectId.isValid(
        clientIdString
      )
        ? {
            $in: [
              clientIdString,
              new ObjectId(clientIdString),
            ],
          }
        : {
            $in: [clientIdString],
          };

      await auth.db
        .collection("clients")
        .updateOne(
          {
            _id: clientFilter,
            businessId: businessFilter,
          } as any,
          {
            $inc: {
              visitsCount: 1,
              totalVisits: 1,
              totalSpent: Number(
                appointment.price || 0
              ),
            },
            $set: {
              lastVisit: appointment.date || null,
              lastVisitAt: appointment.date || null,
              updatedAt: now,
            },
          }
        );

      await auth.db
        .collection("appointments")
        .updateOne(
          { _id: appointmentId },
          {
            $set: {
              countedInClient: true,
            },
          }
        );
    }

    /*
    =============================================
    NÃO DESCONTAR DUAS VEZES
    =============================================
    */

    const freshAppointment = await auth.db
      .collection("appointments")
      .findOne({
        _id: appointmentId,
      });

    if (
      freshAppointment?.membershipUsageConsumed === true
    ) {
      return NextResponse.json({
        ok: true,
        message:
          "Atendimento concluído. O corte deste agendamento já foi descontado.",
      });
    }

    if (!appointment.clientId) {
      return NextResponse.json({
        ok: true,
        message: "Atendimento concluído.",
      });
    }

    /*
    =============================================
    BUSCAR MENSALIDADE
    =============================================
    */

    const clientIdString = String(
      appointment.clientId
    );

    const membershipClientFilter: any =
      ObjectId.isValid(clientIdString)
        ? {
            $in: [
              clientIdString,
              new ObjectId(clientIdString),
            ],
          }
        : {
            $in: [clientIdString],
          };

    const memberships = await auth.db
      .collection("memberships")
      .find({
        businessId: businessFilter,
        clientId: membershipClientFilter,
        active: {
          $ne: false,
        },
        paymentStatus: "paid",
        remainingUses: {
          $gt: 0,
        },
      } as any)
      .sort({
        createdAt: -1,
      })
      .toArray();

    const membership = memberships.find((item) => {
      if (!item.expiresAt) {
        return true;
      }

      const expiration = parseExpirationDate(
        item.expiresAt
      );

      if (!expiration) {
        return true;
      }

      return expiration >= now;
    });

    if (!membership) {
      return NextResponse.json({
        ok: true,
        message:
          "Atendimento concluído. Cliente não possui plano pago com saldo disponível.",
      });
    }

    /*
    =============================================
    RESERVAR CONSUMO DO AGENDAMENTO
    =============================================
    */

    const claim = await auth.db
      .collection("appointments")
      .updateOne(
        {
          _id: appointmentId,
          membershipUsageConsumed: {
            $ne: true,
          },
          membershipUsageProcessing: {
            $ne: true,
          },
        },
        {
          $set: {
            membershipUsageProcessing: true,
            membershipUsageProcessingAt: now,
          },
        }
      );

    if (claim.modifiedCount !== 1) {
      return NextResponse.json({
        ok: true,
        message:
          "O uso deste agendamento já está sendo processado ou já foi descontado.",
      });
    }

    const remainingBefore = Number(
      membership.remainingUses || 0
    );

    /*
    =============================================
    DESCONTAR 1 USO
    =============================================
    */

    const result = await auth.db
      .collection("memberships")
      .updateOne(
        {
          _id: membership._id,
          paymentStatus: "paid",
          active: {
            $ne: false,
          },
          remainingUses: {
            $gt: 0,
          },
        },
        {
          $inc: {
            usedUses: 1,
            remainingUses: -1,
          },
          $set: {
            lastUsageAt: now,
            updatedAt: now,
          },
        }
      );

    if (result.modifiedCount !== 1) {
      await auth.db
        .collection("appointments")
        .updateOne(
          { _id: appointmentId },
          {
            $unset: {
              membershipUsageProcessing: "",
              membershipUsageProcessingAt: "",
            },
          }
        );

      return NextResponse.json(
        {
          ok: false,
          message:
            "Não foi possível descontar o corte do plano.",
        },
        {
          status: 409,
        }
      );
    }

    const remainingAfter = Math.max(
      0,
      remainingBefore - 1
    );

    /*
    =============================================
    MARCAR AGENDAMENTO
    =============================================
    */

    await auth.db
      .collection("appointments")
      .updateOne(
        { _id: appointmentId },
        {
          $set: {
            hasActiveMembership: true,
            membershipId: membership._id,
            membershipPlanName: String(
              membership.planName || "Plano mensal"
            ),
            membershipRemainingBefore:
              remainingBefore,
            membershipRemainingAfter:
              remainingAfter,
            membershipUsageConsumed: true,
            membershipConsumedAt: now,
            updatedAt: now,
          },
          $unset: {
            membershipUsageProcessing: "",
            membershipUsageProcessingAt: "",
          },
        }
      );

    /*
    =============================================
    HISTÓRICO
    =============================================
    */

    await auth.db
      .collection("membership_usages")
      .insertOne({
        businessId: auth.businessId,
        membershipId: membership._id,
        clientId: appointment.clientId,
        appointmentId,
        planId: membership.planId || null,
        planName: String(
          membership.planName || "Plano mensal"
        ),
        serviceId: appointment.serviceId || null,
        serviceName: String(
          appointment.serviceName || ""
        ),
        professionalId:
          appointment.professionalId || null,
        professionalName: String(
          appointment.professionalName || ""
        ),
        date: appointment.date || "",
        time:
          appointment.time ||
          appointment.startTime ||
          "",
        quantity: 1,
        remainingBefore,
        remainingAfter,
        createdAt: now,
      });

    return NextResponse.json({
      ok: true,
      message:
        remainingAfter === 0
          ? "Atendimento concluído. 1 corte foi descontado. Saldo: 0."
          : `Atendimento concluído. 1 corte foi descontado. Restam ${remainingAfter} corte(s).`,
      membership: {
        consumed: true,
        planName: String(
          membership.planName || "Plano mensal"
        ),
        remainingBefore,
        remainingAfter,
      },
    });
  } catch (error) {
    console.error(
      "PUT APPOINTMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao atualizar agendamento",
      },
      {
        status: 500,
      }
    );
  }
}

function parseExpirationDate(
  value: unknown
): Date | null {
  if (!value) {
    return null;
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
      23,
      59,
      59,
      999
    );
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
