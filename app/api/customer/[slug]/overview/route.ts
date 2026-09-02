import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

import { getDb } from "@/lib/db";
import { verifyCustomerSessionToken } from "@/lib/auth";
import { normalizePhone } from "@/lib/booking";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Props
) {
  try {
    const { slug } = await params;

    /*
    =====================================================
    SESSÃO DO CLIENTE
    =====================================================
    */

    const cookieStore =
      await cookies();

    const token =
      cookieStore.get(
        "saas_customer_session"
      )?.value;

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Cliente não autenticado",
        },
        {
          status: 401,
        }
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
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Sessão inválida",
        },
        {
          status: 401,
        }
      );
    }

    /*
    =====================================================
    BANCO / CONTA DO CLIENTE
    =====================================================
    */

    const db =
      await getDb();

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
        });

    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Conta não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    if (
      customer.active === false
    ) {
      return NextResponse.json(
        {
          ok: false,
          authenticated: false,
          message:
            "Conta bloqueada",
        },
        {
          status: 403,
        }
      );
    }

    /*
    =====================================================
    EMPRESA
    =====================================================
    */

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
      return NextResponse.json(
        {
          ok: false,
          message:
            "Empresa não encontrada",
        },
        {
          status: 404,
        }
      );
    }

    const businessId =
      business._id;

    const customerPhone =
      String(
        customer.phone || ""
      ).trim();

    const customerPhoneNormalized =
      String(
        customer.phoneNormalized ||
          normalizePhone(
            customerPhone
          ) ||
          ""
      ).trim();

    const customerEmail =
      String(
        customer.email || ""
      )
        .trim()
        .toLowerCase();

    /*
    =====================================================
    LOCALIZAR CLIENTE DENTRO DA EMPRESA
    =====================================================
    */

    const identityFilters: any[] =
      [];

    if (
      customerPhoneNormalized
    ) {
      identityFilters.push(
        {
          phoneNormalized:
            customerPhoneNormalized,
        },
        {
          phoneNorm:
            customerPhoneNormalized,
        }
      );
    }

    if (customerPhone) {
      identityFilters.push({
        phone: customerPhone,
      });
    }

    if (customerEmail) {
      identityFilters.push({
        email: customerEmail,
      });
    }

    let client: any = null;

    if (
      identityFilters.length >
      0
    ) {
      client =
        await db
          .collection(
            "clients"
          )
          .findOne({
            $and: [
              {
                $or: [
                  {
                    businessId,
                  },
                  {
                    businessId:
                      businessId.toString(),
                  },
                  {
                    businessSlug:
                      slug,
                  },
                ],
              },
              {
                $or:
                  identityFilters,
              },
            ],
          } as any);
    }

    /*
    =====================================================
    SEM VÍNCULO AINDA
    =====================================================
    */

    if (!client) {
      return NextResponse.json({
        ok: true,
        authenticated: true,

        business: {
          id:
            businessId.toString(),

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

          secondaryColor:
            String(
              business.secondaryColor ||
                "#0d1822"
            ),

          backgroundColor:
            String(
              business.backgroundColor ||
                "#071018"
            ),

          textColor:
            String(
              business.textColor ||
                "#ffffff"
            ),

          address:
            String(
              business.address ||
                ""
            ),
        },

        customer: {
          id:
            customer._id.toString(),

          name:
            String(
              customer.name ||
                ""
            ),

          phone:
            customerPhone,

          email:
            customerEmail,

          photoUrl:
            String(
              customer.photoUrl ||
                ""
            ),
        },

        client: null,

        appointments: [],

        upcomingAppointments:
          [],

        appointmentHistory:
          [],

        membership: null,

        memberships: [],
      });
    }

    /*
    =====================================================
    AGENDAMENTOS
    =====================================================
    */

    const appointments =
      await db
        .collection(
          "appointments"
        )
        .find({
          $and: [
            {
              $or: [
                {
                  businessId,
                },
                {
                  businessId:
                    businessId.toString(),
                },
                {
                  businessSlug:
                    slug,
                },
              ],
            },

            {
              $or: [
                {
                  clientId:
                    client._id,
                },
                {
                  clientId:
                    client._id.toString(),
                },
              ],
            },
          ],
        } as any)
        .sort({
          date: -1,
          time: -1,
          createdAt: -1,
        })
        .limit(100)
        .toArray();

    const now =
      new Date();

    const today =
      getDateString(now);

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();

    const mappedAppointments =
      appointments.map(
        (appointment) => {
          const date =
            String(
              appointment.date ||
                ""
            );

          const time =
            String(
              appointment.time ||
                appointment.startTime ||
                ""
            );

          const status =
            String(
              appointment.status ||
                "pendente"
            );

          const isCancelled =
            [
              "cancelado",
              "cancelled",
              "faltou",
            ].includes(
              status.toLowerCase()
            );

          const isCompleted =
            [
              "concluido",
              "concluído",
              "completed",
              "finalizado",
            ].includes(
              status.toLowerCase()
            );

          let isUpcoming =
            false;

          if (
            !isCancelled &&
            !isCompleted &&
            date
          ) {
            if (date > today) {
              isUpcoming =
                true;
            } else if (
              date === today
            ) {
              const appointmentMinutes =
                timeToMinutes(
                  time
                );

              isUpcoming =
                appointmentMinutes ===
                  null ||
                appointmentMinutes >=
                  currentMinutes;
            }
          }

          return {
            id:
              appointment._id.toString(),

            serviceName:
              String(
                appointment.serviceName ||
                  "Serviço"
              ),

            professionalName:
              String(
                appointment.professionalName ||
                  "Profissional"
              ),

            date,

            time,

            endTime:
              String(
                appointment.endTime ||
                  ""
              ),

            duration:
              Number(
                appointment.duration ||
                  appointment.serviceDuration ||
                  0
              ),

            price:
              Number(
                appointment.price ||
                  0
              ),

            status,

            notes:
              String(
                appointment.notes ||
                  ""
              ),

            source:
              String(
                appointment.source ||
                  ""
              ),

            hasActiveMembership:
              Boolean(
                appointment.hasActiveMembership
              ),

            membershipPlanName:
              String(
                appointment.membershipPlanName ||
                  ""
              ),

            membershipUsageConsumed:
              Boolean(
                appointment.membershipUsageConsumed
              ),

            createdAt:
              appointment.createdAt ||
              null,

            updatedAt:
              appointment.updatedAt ||
              null,

            isUpcoming,
          };
        }
      );

    const upcomingAppointments =
      mappedAppointments
        .filter(
          (appointment) =>
            appointment.isUpcoming
        )
        .sort(
          (a, b) =>
            `${a.date} ${a.time}`.localeCompare(
              `${b.date} ${b.time}`
            )
        );

    const appointmentHistory =
      mappedAppointments.filter(
        (appointment) =>
          !appointment.isUpcoming
      );

    /*
    =====================================================
    MENSALIDADES / PLANOS
    =====================================================
    */

    const membershipDocuments =
      await db
        .collection(
          "memberships"
        )
        .find({
          $and: [
            {
              $or: [
                {
                  businessId,
                },
                {
                  businessId:
                    businessId.toString(),
                },
                {
                  businessSlug:
                    slug,
                },
              ],
            },

            {
              $or: [
                {
                  clientId:
                    client._id,
                },
                {
                  clientId:
                    client._id.toString(),
                },
              ],
            },
          ],
        } as any)
        .sort({
          createdAt: -1,
        })
        .toArray();

    const memberships =
      membershipDocuments.map(
        (membership) => {
          const expiresAt =
            String(
              membership.expiresAt ||
                ""
            );

          const paymentDueDate =
            String(
              membership.paymentDueDate ||
                ""
            );

          const paymentStatus =
            String(
              membership.paymentStatus ||
                "pending"
            );

          const isExpired =
            Boolean(
              expiresAt &&
                expiresAt <
                  today
            );

          const isPaymentOverdue =
            paymentStatus !==
              "paid" &&
            Boolean(
              paymentDueDate &&
                paymentDueDate <
                  today
            );

          let displayPaymentStatus =
            paymentStatus;

          if (
            isPaymentOverdue
          ) {
            displayPaymentStatus =
              "overdue";
          }

          return {
            id:
              membership._id.toString(),

            planId:
              membership.planId
                ? String(
                    membership.planId
                  )
                : "",

            planName:
              String(
                membership.planName ||
                  "Plano"
              ),

            price:
              Number(
                membership.price ||
                  0
              ),

            totalUses:
              Number(
                membership.totalUses ||
                  0
              ),

            usedUses:
              Number(
                membership.usedUses ||
                  0
              ),

            remainingUses:
              Number(
                membership.remainingUses ??
                  0
              ),

            validityDays:
              Number(
                membership.validityDays ||
                  0
              ),

            startDate:
              String(
                membership.startDate ||
                  ""
              ),

            expiresAt,

            active:
              membership.active !==
              false,

            paymentMethod:
              String(
                membership.paymentMethod ||
                  "later"
              ),

            paymentStatus,

            displayPaymentStatus,

            paymentAmount:
              Number(
                membership.paymentAmount ??
                  membership.price ??
                  0
              ),

            paymentDueDate,

            paymentPaidAt:
              membership.paymentPaidAt ||
              null,

            isExpired,

            isPaymentOverdue,

            createdAt:
              membership.createdAt ||
              null,

            updatedAt:
              membership.updatedAt ||
              null,
          };
        }
      );

    const membership =
      memberships.find(
        (item) =>
          item.active &&
          !item.isExpired
      ) ||
      memberships[0] ||
      null;

    /*
    =====================================================
    RESPOSTA
    =====================================================
    */

    return NextResponse.json({
      ok: true,
      authenticated: true,

      business: {
        id:
          businessId.toString(),

        name:
          String(
            business.name || ""
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

        address:
          String(
            business.address ||
              ""
          ),
      },

      customer: {
        id:
          customer._id.toString(),

        name:
          String(
            customer.name || ""
          ),

        phone:
          customerPhone,

        email:
          customerEmail,

        photoUrl:
          String(
            customer.photoUrl ||
              ""
          ),
      },

      client: {
        id:
          client._id.toString(),

        name:
          String(
            client.name ||
              customer.name ||
              ""
          ),

        phone:
          String(
            client.phone ||
              customerPhone
          ),

        email:
          String(
            client.email ||
              customerEmail
          ),
      },

      appointments:
        mappedAppointments,

      upcomingAppointments,

      appointmentHistory,

      membership,

      memberships,
    });
  } catch (error) {
    console.error(
      "CUSTOMER OVERVIEW ERROR:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Erro ao carregar área do cliente",
      },
      {
        status: 500,
      }
    );
  }
}

function getDateString(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function timeToMinutes(
  time: string
) {
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(
      time
    )
  ) {
    return null;
  }

  const [hour, minute] =
    time
      .split(":")
      .map(Number);

  return (
    hour * 60 +
    minute
  );
}
