"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type Appointment = {
  _id: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  serviceId?: string;
  serviceName?: string;
  professionalId?: string;
  professionalName?: string;
  date?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  price?: number;

  hasActiveMembership?: boolean;
  membershipPlanName?: string;
  membershipRemainingBefore?: number | null;
  membershipUsageConsumed?: boolean;
  membershipRemainingAfter?: number | null;
};

type Client = {
  _id: string;
  name: string;
  phone?: string;
};

type Service = {
  _id: string;
  name: string;
  price: number;
  duration: number;
  active?: boolean;
};

type Professional = {
  _id: string;
  name: string;
  active?: boolean;
};

type Slot = {
  time: string;
  endTime: string;
};

type CalendarDay = {
  date: string;
  day: number;
  currentMonth: boolean;
  isToday: boolean;
  past: boolean;
};

export default function AgendaPage() {
  const [mounted, setMounted] =
    useState(false);

  const [date, setDate] =
    useState("");

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [services, setServices] =
    useState<Service[]>([]);

  const [professionals, setProfessionals] =
    useState<Professional[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [
    loadingAvailability,
    setLoadingAvailability,
  ] = useState(false);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    whatsAppAppointment,
    setWhatsAppAppointment,
  ] = useState<Appointment | null>(
    null
  );

  const [
    selectedAppointmentAction,
    setSelectedAppointmentAction,
  ] = useState<Appointment | null>(
    null
  );

  const [
    editingAppointment,
    setEditingAppointment,
  ] = useState<Appointment | null>(
    null
  );

  const [
    editServiceId,
    setEditServiceId,
  ] = useState("");

  const [
    editProfessionalId,
    setEditProfessionalId,
  ] = useState("");

  const [
    editDate,
    setEditDate,
  ] = useState("");

  const [
    editTime,
    setEditTime,
  ] = useState("");

  const [
    editSlots,
    setEditSlots,
  ] = useState<Slot[]>([]);

  const [
    editLoadingAvailability,
    setEditLoadingAvailability,
  ] = useState(false);

  const [
    editAvailabilityMessage,
    setEditAvailabilityMessage,
  ] = useState("");

  const [
    editSaving,
    setEditSaving,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("todos");

  const [
    showNewAppointment,
    setShowNewAppointment,
  ] = useState(false);

  const [clientId, setClientId] =
    useState("");

  const [
    clientSearch,
    setClientSearch,
  ] = useState("");

  const [
    showQuickClient,
    setShowQuickClient,
  ] = useState(false);

  const [
    newClientName,
    setNewClientName,
  ] = useState("");

  const [
    newClientPhone,
    setNewClientPhone,
  ] = useState("");

  const [
    creatingClient,
    setCreatingClient,
  ] = useState(false);

  const [
    clientFormMessage,
    setClientFormMessage,
  ] = useState("");

  const [
    clientFormSuccess,
    setClientFormSuccess,
  ] = useState("");

  const [serviceId, setServiceId] =
    useState("");

  const [
    professionalId,
    setProfessionalId,
  ] = useState("");

  const [
    appointmentDate,
    setAppointmentDate,
  ] = useState("");

  const [
    appointmentTime,
    setAppointmentTime,
  ] = useState("");

  const [slots, setSlots] =
    useState<Slot[]>([]);

  const [
    availabilityMessage,
    setAvailabilityMessage,
  ] = useState("");

  const [
    calendarMonth,
    setCalendarMonth,
  ] = useState("");

  useEffect(() => {
    setMounted(true);

    const current =
      todaySaoPaulo();

    setDate(current);

    setAppointmentDate(
      current
    );

    setCalendarMonth(
      current.slice(0, 7)
    );
  }, []);

  useEffect(() => {
    if (
      !mounted ||
      !date
    ) {
      return;
    }

    loadAppointments();
  }, [
    mounted,
    date,
  ]);

  useEffect(() => {
    if (
      !showNewAppointment
    ) {
      return;
    }

    if (
      !serviceId ||
      !professionalId ||
      !appointmentDate
    ) {
      setSlots([]);
      setAppointmentTime("");
      setAvailabilityMessage("");
      return;
    }

    loadAvailability();
  }, [
    showNewAppointment,
    serviceId,
    professionalId,
    appointmentDate,
  ]);

  useEffect(() => {
    if (
      !editingAppointment ||
      !editServiceId ||
      !editProfessionalId ||
      !editDate
    ) {
      return;
    }

    loadEditAvailability();
  }, [
    editingAppointment,
    editServiceId,
    editProfessionalId,
    editDate,
  ]);

  async function loadAppointments() {
    try {
      setLoading(true);
      setMessage("");

      const response =
        await fetch(
          `/api/dashboard/appointments?date=${encodeURIComponent(
            date
          )}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            `Erro ao carregar agenda. Status ${response.status}.`
        );

        setAppointments([]);

        return;
      }

      setAppointments(
        Array.isArray(
          data.appointments
        )
          ? data.appointments
          : []
      );
    } catch (error) {
      console.error(
        "LOAD APPOINTMENTS ERROR:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          "Erro ao carregar agenda"
        )
      );

      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  async function openNewAppointment() {
    try {
      setMessage("");
      setSuccess("");
      setWhatsAppAppointment(
        null
      );

      const [
        clientsResponse,
        servicesResponse,
        professionalsResponse,
      ] = await Promise.all([
        fetch(
          "/api/dashboard/booking-clients",
          {
            cache:
              "no-store",
          }
        ),

        fetch(
          "/api/services",
          {
            cache:
              "no-store",
          }
        ),

        fetch(
          "/api/dashboard/booking-professionals",
          {
            cache:
              "no-store",
          }
        ),
      ]);

      const clientsData =
        await readJsonResponse(
          clientsResponse
        );

      const servicesData =
        await readJsonResponse(
          servicesResponse
        );

      const professionalsData =
        await readJsonResponse(
          professionalsResponse
        );

      if (!clientsResponse.ok) {
        setMessage(
          clientsData.message ||
            "Erro ao carregar clientes"
        );

        return;
      }

      if (!servicesResponse.ok) {
        setMessage(
          servicesData.message ||
            "Erro ao carregar serviços"
        );

        return;
      }

      if (!professionalsResponse.ok) {
        setMessage(
          professionalsData.message ||
            "Erro ao carregar profissionais"
        );

        return;
      }

      setClients(
        Array.isArray(
          clientsData.clients
        )
          ? clientsData.clients
          : []
      );

      setServices(
        (
          Array.isArray(
            servicesData.services
          )
            ? servicesData.services
            : []
        ).filter(
          (
            service: Service
          ) =>
            service.active !==
            false
        )
      );

      const availableProfessionals =
        (
          Array.isArray(
            professionalsData.professionals
          )
            ? professionalsData.professionals
            : []
        ).filter(
          (
            professional: Professional
          ) =>
            professional.active !==
            false
        );

      setProfessionals(
        availableProfessionals
      );

      const current =
        todaySaoPaulo();

      setClientId("");
      setClientSearch("");
      setShowQuickClient(false);
      setNewClientName("");
      setNewClientPhone("");
      setClientFormMessage("");
      setClientFormSuccess("");

      setServiceId("");
      setProfessionalId(
        availableProfessionals.length ===
          1
          ? availableProfessionals[0]._id
          : ""
      );
      setAppointmentTime("");
      setSlots([]);
      setAvailabilityMessage("");

      setAppointmentDate(
        current
      );

      setCalendarMonth(
        current.slice(
          0,
          7
        )
      );

      setShowNewAppointment(
        true
      );
    } catch (error) {
      console.error(
        "OPEN APPOINTMENT ERROR:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          "Erro ao abrir novo agendamento"
        )
      );
    }
  }

  async function loadAvailability() {
    try {
      setLoadingAvailability(
        true
      );

      setSlots([]);
      setAppointmentTime("");
      setAvailabilityMessage(
        ""
      );

      const params =
        new URLSearchParams({
          serviceId,
          professionalId,
          date:
            appointmentDate,
        });

      const response =
        await fetch(
          `/api/dashboard/availability?${params.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setAvailabilityMessage(
          data.message ||
            "Erro ao consultar horários"
        );

        return;
      }

      const receivedSlots =
        Array.isArray(
          data.slots
        )
          ? data.slots
          : [];

      setSlots(
        receivedSlots
      );

      if (
        receivedSlots.length ===
        0
      ) {
        setAvailabilityMessage(
          data.message ||
            "Nenhum horário disponível nesta data."
        );
      }
    } catch (error) {
      console.error(
        "AVAILABILITY ERROR:",
        error
      );

      setAvailabilityMessage(
        getErrorMessage(
          error,
          "Erro ao consultar disponibilidade"
        )
      );
    } finally {
      setLoadingAvailability(
        false
      );
    }
  }

  function closeNewAppointment() {
    if (saving) {
      return;
    }

    setShowNewAppointment(
      false
    );
  }

  async function createQuickClient() {
    const name =
      newClientName.trim();

    const phone =
      newClientPhone.trim();

    if (
      name.length < 2
    ) {
      setClientFormMessage(
        "Informe o nome do cliente."
      );

      setClientFormSuccess("");

      return;
    }

    if (
      phone.replace(
        /\D/g,
        ""
      ).length < 8
    ) {
      setClientFormMessage(
        "Informe um telefone válido."
      );

      setClientFormSuccess("");

      return;
    }

    try {
      setCreatingClient(
        true
      );

      setClientFormMessage(
        ""
      );

      setClientFormSuccess(
        ""
      );

      const response =
        await fetch(
          "/api/dashboard/booking-clients",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                phone,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      /*
      ===============================================
      CLIENTE JÁ EXISTE
      Selecionamos automaticamente.
      ===============================================
      */

      if (
        response.status ===
          409 &&
        data.existingClient?._id
      ) {
        const existing =
          data.existingClient as Client;

        setClients(
          (current) => {
            const alreadyExists =
              current.some(
                (client) =>
                  client._id ===
                  existing._id
              );

            if (
              alreadyExists
            ) {
              return current;
            }

            return [
              ...current,
              existing,
            ].sort(
              (a, b) =>
                a.name.localeCompare(
                  b.name,
                  "pt-BR"
                )
            );
          }
        );

        setClientId(
          existing._id
        );

        setClientSearch(
          ""
        );

        setNewClientName(
          ""
        );

        setNewClientPhone(
          ""
        );

        setShowQuickClient(
          false
        );

        setClientFormSuccess(
          "Cliente já estava cadastrado e foi selecionado automaticamente."
        );

        return;
      }

      if (!response.ok) {
        setClientFormMessage(
          data.message ||
            "Erro ao cadastrar cliente"
        );

        return;
      }

      const createdClient =
        data.client as
          | Client
          | undefined;

      if (
        !createdClient?._id
      ) {
        setClientFormMessage(
          "Cliente criado, mas a API não retornou os dados corretamente."
        );

        return;
      }

      setClients(
        (current) =>
          [
            ...current,
            createdClient,
          ].sort(
            (a, b) =>
              a.name.localeCompare(
                b.name,
                "pt-BR"
              )
          )
      );

      setClientId(
        createdClient._id
      );

      setClientSearch(
        ""
      );

      setNewClientName(
        ""
      );

      setNewClientPhone(
        ""
      );

      setShowQuickClient(
        false
      );

      setClientFormSuccess(
        "Cliente cadastrado e selecionado."
      );
    } catch (error) {
      console.error(
        "CREATE QUICK CLIENT ERROR:",
        error
      );

      setClientFormMessage(
        getErrorMessage(
          error,
          "Erro ao cadastrar cliente"
        )
      );
    } finally {
      setCreatingClient(
        false
      );
    }
  }

  async function createAppointment() {
    if (!clientId) {
      setMessage(
        "Selecione um cliente."
      );

      return;
    }

    if (!serviceId) {
      setMessage(
        "Selecione um serviço."
      );

      return;
    }

    if (!professionalId) {
      setMessage(
        "Selecione um profissional."
      );

      return;
    }

    if (!appointmentDate) {
      setMessage(
        "Selecione uma data."
      );

      return;
    }

    if (!appointmentTime) {
      setMessage(
        "Selecione um horário disponível."
      );

      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setSuccess("");

      const response =
        await fetch(
          "/api/dashboard/appointments",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                clientId,
                serviceId,
                professionalId,

                date:
                  appointmentDate,

                time:
                  appointmentTime,

                startTime:
                  appointmentTime,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao criar agendamento"
        );

        return;
      }

      setShowNewAppointment(
        false
      );

      setDate(
        appointmentDate
      );

      setSuccess(
        data.message ||
          "Agendamento criado com sucesso."
      );

      if (
        data.appointment?._id
      ) {
        setWhatsAppAppointment(
          data.appointment as Appointment
        );
      }

      await loadAppointments();
    } catch (error) {
      console.error(
        "CREATE APPOINTMENT ERROR:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          "Erro ao criar agendamento"
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    appointmentId: string,
    status: string
  ): Promise<boolean> {
    try {
      setUpdatingId(
        appointmentId
      );

      setMessage("");
      setSuccess("");
      setWhatsAppAppointment(
        null
      );

      const response =
        await fetch(
          `/api/dashboard/appointments/${appointmentId}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                status,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao atualizar agendamento"
        );

        return false;
      }

      setSuccess(
        data.message ||
          "Agendamento atualizado."
      );

      if (
        status ===
        "confirmado"
      ) {
        const confirmedAppointment =
          appointments.find(
            (appointment) =>
              appointment._id ===
              appointmentId
          );

        if (
          confirmedAppointment
        ) {
          setWhatsAppAppointment({
            ...confirmedAppointment,
            status:
              "confirmado",
          });
        }
      }

      await loadAppointments();

      return true;
    } catch (error) {
      console.error(
        "UPDATE APPOINTMENT ERROR:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          "Erro ao atualizar agendamento"
        )
      );

      return false;
    } finally {
      setUpdatingId(
        null
      );
    }
  }

  async function changeStatusFromSheet(
    appointment: Appointment,
    status: string
  ) {
    const success =
      await updateStatus(
        appointment._id,
        status
      );

    if (success) {
      setSelectedAppointmentAction(
        null
      );
    }

    return success;
  }

  async function confirmAndSendWhatsApp(
    appointment: Appointment
  ) {
    const success =
      await updateStatus(
        appointment._id,
        "confirmado"
      );

    if (!success) {
      return;
    }

    setSelectedAppointmentAction(
      null
    );

    openWhatsAppConfirmation({
      ...appointment,
      status:
        "confirmado",
    });
  }

  function generateReceipt(
    appointment: Appointment
  ) {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const receipt =
      window.open(
        "",
        "_blank",
        "width=520,height=720"
      );

    if (!receipt) {
      setMessage(
        "O navegador bloqueou a abertura do recibo."
      );

      return;
    }

    const value =
      typeof appointment.price ===
      "number"
        ? formatPrice(
            appointment.price
          )
        : "-";

    const receiptHtml = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Recibo de atendimento</title>

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 32px;
              color: #111;
              font-family: Arial, Helvetica, sans-serif;
              background: #fff;
            }

            .receipt {
              max-width: 440px;
              margin: 0 auto;
              border: 1px solid #ddd;
              border-radius: 16px;
              padding: 28px;
            }

            h1 {
              margin: 0;
              font-size: 24px;
            }

            .muted {
              color: #666;
              font-size: 13px;
            }

            .line {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              border-bottom: 1px solid #eee;
              padding: 12px 0;
              font-size: 14px;
            }

            .line strong {
              text-align: right;
            }

            .total {
              margin-top: 18px;
              font-size: 20px;
              font-weight: bold;
            }

            .footer {
              margin-top: 26px;
              text-align: center;
              color: #777;
              font-size: 12px;
            }

            @media print {
              body {
                padding: 0;
              }

              .receipt {
                border: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <h1>VELLTO</h1>

            <p class="muted">
              Recibo de atendimento
            </p>

            <div class="line">
              <span>Cliente</span>
              <strong>${escapeReceiptHtml(
                appointment.clientName ||
                  "Cliente"
              )}</strong>
            </div>

            <div class="line">
              <span>Serviço</span>
              <strong>${escapeReceiptHtml(
                appointment.serviceName ||
                  "-"
              )}</strong>
            </div>

            <div class="line">
              <span>Profissional</span>
              <strong>${escapeReceiptHtml(
                appointment.professionalName ||
                  "-"
              )}</strong>
            </div>

            <div class="line">
              <span>Data</span>
              <strong>${escapeReceiptHtml(
                appointment.date
                  ? formatDate(
                      appointment.date
                    )
                  : "-"
              )}</strong>
            </div>

            <div class="line">
              <span>Horário</span>
              <strong>${escapeReceiptHtml(
                appointment.time ||
                  appointment.startTime ||
                  "-"
              )}</strong>
            </div>

            <div class="total">
              Valor: ${escapeReceiptHtml(
                value
              )}
            </div>

            <div class="footer">
              Comprovante gerado pela Vellto Agenda
            </div>
          </div>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    receipt.document.open();
    receipt.document.write(
      receiptHtml
    );
    receipt.document.close();

    setSelectedAppointmentAction(
      null
    );
  }

  async function openEditAppointment(
    appointment: Appointment
  ) {
    try {
      setMessage("");
      setSuccess("");

      /*
      Caso as listas ainda não estejam carregadas,
      carrega agora.
      */
      if (
        services.length === 0 ||
        professionals.length === 0
      ) {
        const [
          servicesResponse,
          professionalsResponse,
        ] = await Promise.all([
          fetch(
            "/api/services",
            {
              cache:
                "no-store",
            }
          ),

          fetch(
            "/api/dashboard/booking-professionals",
            {
              cache:
                "no-store",
            }
          ),
        ]);

        const servicesData =
          await readJsonResponse(
            servicesResponse
          );

        const professionalsData =
          await readJsonResponse(
            professionalsResponse
          );

        if (
          !servicesResponse.ok
        ) {
          setMessage(
            servicesData.message ||
              "Erro ao carregar serviços."
          );

          return;
        }

        if (
          !professionalsResponse.ok
        ) {
          setMessage(
            professionalsData.message ||
              "Erro ao carregar profissionais."
          );

          return;
        }

        setServices(
          (
            Array.isArray(
              servicesData.services
            )
              ? servicesData.services
              : []
          ).filter(
            (
              service: Service
            ) =>
              service.active !==
              false
          )
        );

        setProfessionals(
          (
            Array.isArray(
              professionalsData.professionals
            )
              ? professionalsData.professionals
              : []
          ).filter(
            (
              professional: Professional
            ) =>
              professional.active !==
              false
          )
        );
      }

      setEditServiceId(
        String(
          appointment.serviceId ||
            ""
        )
      );

      setEditProfessionalId(
        String(
          appointment.professionalId ||
            ""
        )
      );

      setEditDate(
        String(
          appointment.date ||
            todaySaoPaulo()
        )
      );

      setEditTime(
        String(
          appointment.time ||
            appointment.startTime ||
            ""
        )
      );

      setEditSlots([]);
      setEditAvailabilityMessage("");

      setSelectedAppointmentAction(
        null
      );

      setEditingAppointment(
        appointment
      );
    } catch (error) {
      console.error(
        "OPEN EDIT APPOINTMENT ERROR:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          "Erro ao abrir edição."
        )
      );
    }
  }

  async function loadEditAvailability() {
    if (
      !editingAppointment ||
      !editServiceId ||
      !editProfessionalId ||
      !editDate
    ) {
      return;
    }

    try {
      setEditLoadingAvailability(
        true
      );

      setEditAvailabilityMessage(
        ""
      );

      const params =
        new URLSearchParams({
          serviceId:
            editServiceId,

          professionalId:
            editProfessionalId,

          date:
            editDate,

          appointmentId:
            editingAppointment._id,
        });

      const response =
        await fetch(
          `/api/dashboard/availability?${params.toString()}`,
          {
            cache:
              "no-store",
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setEditSlots([]);

        setEditAvailabilityMessage(
          data.message ||
            "Erro ao consultar horários."
        );

        return;
      }

      const received =
        Array.isArray(
          data.slots
        )
          ? data.slots
          : [];

      setEditSlots(
        received
      );

      /*
      Mantém o horário atual disponível
      visualmente mesmo se não vier da API.
      */
      const current =
        String(
          editingAppointment.time ||
            editingAppointment.startTime ||
            ""
        );

      const sameContext =
        editServiceId ===
          String(
            editingAppointment.serviceId ||
              ""
          ) &&
        editProfessionalId ===
          String(
            editingAppointment.professionalId ||
              ""
          ) &&
        editDate ===
          String(
            editingAppointment.date ||
              ""
          );

      if (
        sameContext &&
        current &&
        !received.some(
          (slot: Slot) =>
            slot.time ===
            current
        )
      ) {
        setEditSlots([
          {
            time:
              current,

            endTime:
              editingAppointment.endTime ||
              "",
          },
          ...received,
        ]);
      }

      if (
        received.length ===
        0 &&
        !sameContext
      ) {
        setEditAvailabilityMessage(
          data.message ||
            "Nenhum horário disponível nesta data."
        );
      }
    } catch (error) {
      console.error(
        "EDIT AVAILABILITY ERROR:",
        error
      );

      setEditSlots([]);

      setEditAvailabilityMessage(
        getErrorMessage(
          error,
          "Erro ao consultar disponibilidade."
        )
      );
    } finally {
      setEditLoadingAvailability(
        false
      );
    }
  }

  async function saveEditedAppointment() {
    if (
      !editingAppointment
    ) {
      return;
    }

    if (
      !editServiceId ||
      !editProfessionalId ||
      !editDate ||
      !editTime
    ) {
      setMessage(
        "Preencha serviço, profissional, data e horário."
      );

      return;
    }

    try {
      setEditSaving(
        true
      );

      setMessage("");
      setSuccess("");

      const response =
        await fetch(
          `/api/dashboard/appointments/${editingAppointment._id}/edit`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                serviceId:
                  editServiceId,

                professionalId:
                  editProfessionalId,

                date:
                  editDate,

                time:
                  editTime,
              }),
          }
        );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Erro ao editar agendamento."
        );

        return;
      }

      setEditingAppointment(
        null
      );

      setSuccess(
        data.message ||
          "Agendamento atualizado com sucesso."
      );

      setDate(
        editDate
      );

      await loadAppointments();
    } catch (error) {
      console.error(
        "SAVE EDIT APPOINTMENT ERROR:",
        error
      );

      setMessage(
        getErrorMessage(
          error,
          "Erro ao editar agendamento."
        )
      );
    } finally {
      setEditSaving(
        false
      );
    }
  }

  function previousDay() {
    if (!date) {
      return;
    }

    setDate(
      changeDay(
        date,
        -1
      )
    );
  }

  function nextDay() {
    if (!date) {
      return;
    }

    setDate(
      changeDay(
        date,
        1
      )
    );
  }

  function goToday() {
    setDate(
      todaySaoPaulo()
    );
  }

  function previousMonth() {
    setCalendarMonth(
      changeMonth(
        calendarMonth,
        -1
      )
    );
  }

  function nextMonth() {
    setCalendarMonth(
      changeMonth(
        calendarMonth,
        1
      )
    );
  }

  function selectCalendarDay(
    day: CalendarDay
  ) {
    if (day.past) {
      return;
    }

    setAppointmentDate(
      day.date
    );

    setAppointmentTime(
      ""
    );
  }

  const filteredClients =
    useMemo(() => {
      const term =
        clientSearch
          .trim()
          .toLowerCase();

      if (!term) {
        return clients;
      }

      const searchDigits =
        term.replace(
          /\D/g,
          ""
        );

      return clients.filter(
        (client) => {
          const name =
            String(
              client.name ||
                ""
            ).toLowerCase();

          const phone =
            String(
              client.phone ||
                ""
            );

          const phoneDigits =
            phone.replace(
              /\D/g,
              ""
            );

          return (
            name.includes(
              term
            ) ||
            phone
              .toLowerCase()
              .includes(
                term
              ) ||
            Boolean(
              searchDigits &&
                phoneDigits.includes(
                  searchDigits
                )
            )
          );
        }
      );
    }, [
      clients,
      clientSearch,
    ]);

  const selectedService =
    useMemo(() => {
      return services.find(
        (service) =>
          service._id ===
          serviceId
      );
    }, [
      services,
      serviceId,
    ]);

  const selectedProfessional =
    useMemo(() => {
      return professionals.find(
        (
          professional
        ) =>
          professional._id ===
          professionalId
      );
    }, [
      professionals,
      professionalId,
    ]);

  const selectedClient =
    useMemo(() => {
      return clients.find(
        (client) =>
          client._id ===
          clientId
      );
    }, [
      clients,
      clientId,
    ]);

  const calendarDays =
    useMemo(() => {
      if (!calendarMonth) {
        return [];
      }

      return buildCalendar(
        calendarMonth
      );
    }, [
      calendarMonth,
    ]);

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return appointments.filter(
        (
          appointment
        ) => {
          const normalized =
            normalizeStatus(
              appointment.status
            );

          if (
            statusFilter !==
              "todos" &&
            normalized !==
              statusFilter
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          return [
            appointment.clientName,
            appointment.clientPhone,
            appointment.serviceName,
            appointment.professionalName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term);
        }
      );
    }, [
      appointments,
      search,
      statusFilter,
    ]);

  const stats =
    useMemo(() => {
      return {
        total:
          appointments.length,

        pendente:
          appointments.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "pendente"
          ).length,

        confirmado:
          appointments.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "confirmado"
          ).length,

        concluido:
          appointments.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "concluido"
          ).length,

        cancelado:
          appointments.filter(
            (item) =>
              normalizeStatus(
                item.status
              ) ===
              "cancelado"
          ).length,
      };
    }, [
      appointments,
    ]);

  if (!mounted) {
    return (
      <main className="min-h-screen">
        <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Agenda
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Carregando agenda...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="border-b border-white/10 bg-[#09131d]/70 px-4 py-4 backdrop-blur-xl sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-zinc-500">
              Painel da empresa
            </p>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
              Agenda
            </h1>

            <p className="mt-1 text-sm text-zinc-500">
              Gerencie os atendimentos e horários disponíveis.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={
                openNewAppointment
              }
              className="col-span-4 flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 sm:col-auto sm:px-5"
            >
              + Novo agendamento
            </button>

            <button
              type="button"
              onClick={
                previousDay
              }
              className="flex min-h-[46px] items-center justify-center rounded-xl border border-white/10 px-3 py-3 transition hover:bg-white/5 sm:px-4"
            >
              ←
            </button>

            <button
              type="button"
              onClick={
                goToday
              }
              className="flex min-h-[46px] items-center justify-center rounded-xl border border-white/10 px-3 py-3 text-sm font-semibold transition hover:bg-white/5 sm:px-4"
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={
                nextDay
              }
              className="rounded-xl border border-white/10 px-4 py-3 transition hover:bg-white/5"
            >
              →
            </button>

            <input
              type="date"
              value={date}
              onChange={(
                event
              ) =>
                setDate(
                  event.target.value
                )
              }
              className="col-span-4 min-h-[46px] w-full rounded-xl border border-white/10 bg-[#071018] px-3 py-3 text-sm outline-none focus:border-emerald-500 sm:col-auto sm:w-auto sm:px-4"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
          <StatCard
            label="Total"
            value={
              stats.total
            }
          />

          <StatCard
            label="Pendentes"
            value={
              stats.pendente
            }
          />

          <StatCard
            label="Confirmados"
            value={
              stats.confirmado
            }
          />

          <StatCard
            label="Concluídos"
            value={
              stats.concluido
            }
          />

          <StatCard
            label="Cancelados"
            value={
              stats.cancelado
            }
          />
        </div>

        <section className="mt-5 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:mt-6 sm:p-5 lg:grid-cols-[1fr_240px]">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Buscar
            </label>

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Cliente, serviço ou profissional..."
              className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-base outline-none focus:border-emerald-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="todos">
                Todos
              </option>

              <option value="pendente">
                Pendentes
              </option>

              <option value="confirmado">
                Confirmados
              </option>

              <option value="concluido">
                Concluídos
              </option>

              <option value="cancelado">
                Cancelados
              </option>

              <option value="faltou">
                Faltou
              </option>
            </select>
          </div>
        </section>

        {message ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            {message}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-emerald-300">
                {success}
              </p>

              {whatsAppAppointment &&
              canSendWhatsApp(
                whatsAppAppointment.clientPhone
              ) ? (
                <button
                  type="button"
                  onClick={() =>
                    openWhatsAppConfirmation(
                      whatsAppAppointment
                    )
                  }
                  className="flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Enviar confirmação no WhatsApp
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:mt-6">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:gap-4 sm:p-5">
            <div>
              <h2 className="font-bold">
                Atendimentos
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                {formatDate(
                  date
                )}
              </p>
            </div>

            <p className="text-xs text-zinc-500">
              {filtered.length} atendimento
              {filtered.length ===
              1
                ? ""
                : "s"}
            </p>
          </div>

          {loading ? (
            <EmptyState
              title="Carregando agenda..."
              description="Aguarde enquanto buscamos os atendimentos."
            />
          ) : filtered.length ===
            0 ? (
            <EmptyState
              title="Nenhum atendimento"
              description="Não existem atendimentos para esta data."
            />
          ) : (
            <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
              {filtered.map(
                (
                  appointment
                ) => (
                  <AppointmentCard
                    key={
                      appointment._id
                    }
                    appointment={
                      appointment
                    }
                    updating={
                      updatingId ===
                      appointment._id
                    }
                    onOpen={() =>
                      setSelectedAppointmentAction(
                        appointment
                      )
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {showNewAppointment ? (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:p-4">
          <div className="mx-auto min-h-screen w-full max-w-5xl overflow-hidden bg-[#0a141d] shadow-2xl sm:my-6 sm:min-h-0 sm:rounded-3xl sm:border sm:border-white/10">
            <div className="flex items-start justify-between gap-3 border-b border-white/10 p-4 sm:items-center sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Agenda
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Novo agendamento
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Escolha cliente, serviço, profissional, dia e horário.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeNewAppointment
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 p-0 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Cliente
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickClient(
                          (current) =>
                            !current
                        );

                        setClientFormMessage(
                          ""
                        );

                        setClientFormSuccess(
                          ""
                        );
                      }}
                      className="text-xs font-bold text-emerald-400 transition hover:text-emerald-300"
                    >
                      {showQuickClient
                        ? "Cancelar cadastro"
                        : "+ Novo cliente"}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={
                      clientSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setClientSearch(
                        event.target.value
                      )
                    }
                    placeholder="Buscar por nome ou telefone..."
                    className="mb-2 min-h-[44px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                  />

                  <select
                    value={
                      clientId
                    }
                    onChange={(
                      event
                    ) =>
                      setClientId(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">
                      Selecione um cliente
                    </option>

                    {filteredClients.map(
                      (client) => (
                        <option
                          key={
                            client._id
                          }
                          value={
                            client._id
                          }
                        >
                          {client.phone
                            ? `${client.name} - ${formatPhone(
                                client.phone
                              )}`
                            : client.name}
                        </option>
                      )
                    )}
                  </select>

                  {clientSearch &&
                  filteredClients.length ===
                    0 ? (
                    <p className="mt-2 text-xs text-amber-400">
                      Nenhum cliente encontrado. Você pode cadastrar um novo logo abaixo.
                    </p>
                  ) : null}

                  {showQuickClient ? (
                    <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div>
                        <p className="font-semibold text-emerald-300">
                          Novo cliente
                        </p>

                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                          Cadastre rapidamente e continue o agendamento.
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                            Nome
                          </label>

                          <input
                            type="text"
                            value={
                              newClientName
                            }
                            onChange={(
                              event
                            ) =>
                              setNewClientName(
                                event.target.value
                              )
                            }
                            placeholder="Nome do cliente"
                            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-zinc-400">
                            Telefone
                          </label>

                          <input
                            type="tel"
                            inputMode="numeric"
                            value={
                              newClientPhone
                            }
                            onChange={(
                              event
                            ) =>
                              setNewClientPhone(
                                formatPhoneInput(
                                  event.target.value
                                )
                              )
                            }
                            placeholder="(21) 99999-9999"
                            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={
                            creatingClient
                          }
                          onClick={
                            createQuickClient
                          }
                          className="min-h-[44px] w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {creatingClient
                            ? "Cadastrando..."
                            : "Cadastrar e selecionar"}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {clientFormMessage ? (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300">
                      {clientFormMessage}
                    </div>
                  ) : null}

                  {clientFormSuccess ? (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                      {clientFormSuccess}
                    </div>
                  ) : null}
                </div>

                <SelectField
                  label="Serviço"
                  value={
                    serviceId
                  }
                  onChange={(
                    value
                  ) => {
                    setServiceId(
                      value
                    );

                    setAppointmentTime(
                      ""
                    );
                  }}
                  options={services.map(
                    (
                      service
                    ) => ({
                      value:
                        service._id,

                      label:
                        `${service.name} - ${formatPrice(
                          service.price
                        )}`,
                    })
                  )}
                  placeholder="Selecione um serviço"
                />

                <SelectField
                  label="Profissional"
                  value={
                    professionalId
                  }
                  onChange={(
                    value
                  ) => {
                    setProfessionalId(
                      value
                    );

                    setAppointmentTime(
                      ""
                    );
                  }}
                  options={professionals.map(
                    (
                      professional
                    ) => ({
                      value:
                        professional._id,

                      label:
                        professional.name,
                    })
                  )}
                  placeholder="Selecione um profissional"
                />

                <div className="rounded-2xl border border-white/10 bg-[#071018] p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Resumo
                  </p>

                  <div className="mt-4 space-y-3">
                    <SummaryLine
                      label="Cliente"
                      value={
                        selectedClient?.name ||
                        "-"
                      }
                    />

                    <SummaryLine
                      label="Serviço"
                      value={
                        selectedService?.name ||
                        "-"
                      }
                    />

                    <SummaryLine
                      label="Profissional"
                      value={
                        selectedProfessional?.name ||
                        "-"
                      }
                    />

                    <SummaryLine
                      label="Data"
                      value={
                        appointmentDate
                          ? formatDate(
                              appointmentDate
                            )
                          : "-"
                      }
                    />

                    <SummaryLine
                      label="Horário"
                      value={
                        appointmentTime ||
                        "-"
                      }
                    />

                    <SummaryLine
                      label="Valor"
                      value={
                        selectedService
                          ? formatPrice(
                              selectedService.price
                            )
                          : "-"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={
                        previousMonth
                      }
                      className="rounded-xl border border-white/10 px-4 py-2 transition hover:bg-white/5"
                    >
                      ←
                    </button>

                    <div className="text-center">
                      <p className="text-xs uppercase tracking-widest text-zinc-500">
                        Escolha o dia
                      </p>

                      <h3 className="mt-1 text-lg font-bold capitalize">
                        {formatMonthLabel(
                          calendarMonth
                        )}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={
                        nextMonth
                      }
                      className="rounded-xl border border-white/10 px-4 py-2 transition hover:bg-white/5"
                    >
                      →
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase text-zinc-600">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {calendarDays.map(
                      (
                        day
                      ) => {
                        const selected =
                          appointmentDate ===
                          day.date;

                        return (
                          <button
                            key={
                              day.date
                            }
                            type="button"
                            disabled={
                              day.past
                            }
                            onClick={() =>
                              selectCalendarDay(
                                day
                              )
                            }
                            className={`relative aspect-square rounded-xl border text-sm font-semibold transition ${
                              selected
                                ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                                : day.past
                                  ? "cursor-not-allowed border-transparent text-zinc-700"
                                  : day.currentMonth
                                    ? "border-white/10 bg-[#071018] text-zinc-300 hover:border-emerald-500/50 hover:bg-emerald-500/5"
                                    : "border-transparent text-zinc-700"
                            }`}
                          >
                            {day.day}

                            {day.isToday &&
                            !selected ? (
                              <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-400" />
                            ) : null}
                          </button>
                        );
                      }
                    )}
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Horários disponíveis
                      </p>

                      <h3 className="mt-1 font-bold">
                        {appointmentDate
                          ? formatDate(
                              appointmentDate
                            )
                          : "Selecione uma data"}
                      </h3>
                    </div>

                    {selectedService ? (
                      <p className="text-xs text-zinc-500">
                        {
                          selectedService.duration
                        }{" "}
                        min
                      </p>
                    ) : null}
                  </div>

                  {!serviceId ||
                  !professionalId ? (
                    <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
                      Selecione primeiro o serviço e o profissional.
                    </div>
                  ) : loadingAvailability ? (
                    <div className="mt-5 rounded-xl border border-white/10 p-8 text-center text-sm text-zinc-500">
                      Buscando horários...
                    </div>
                  ) : slots.length ===
                    0 ? (
                    <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center">
                      <p className="text-sm font-semibold">
                        Nenhum horário disponível
                      </p>

                      <p className="mt-2 text-xs text-zinc-500">
                        {availabilityMessage ||
                          "Escolha outra data."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {slots.map(
                        (
                          slot
                        ) => (
                          <button
                            key={
                              `${slot.time}-${slot.endTime}`
                            }
                            type="button"
                            onClick={() =>
                              setAppointmentTime(
                                slot.time
                              )
                            }
                            className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                              appointmentTime ===
                              slot.time
                                ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                                : "border-white/10 bg-[#071018] hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-400"
                            }`}
                          >
                            {slot.time}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </section>

                {message ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                    {message}
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeNewAppointment
                    }
                    disabled={
                      saving
                    }
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={
                      createAppointment
                    }
                    disabled={
                      saving ||
                      !clientId ||
                      !serviceId ||
                      !professionalId ||
                      !appointmentDate ||
                      !appointmentTime
                    }
                    className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving
                      ? "Agendando..."
                      : "Criar agendamento"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingAppointment ? (
        <div className="fixed inset-0 z-[220] overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:p-4">
          <div className="mx-auto min-h-screen w-full max-w-2xl bg-[#0a141d] shadow-2xl sm:my-8 sm:min-h-0 sm:rounded-3xl sm:border sm:border-white/10">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Agenda
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Editar agendamento
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {editingAppointment.clientName ||
                    "Cliente"}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  editSaving
                }
                onClick={() =>
                  setEditingAppointment(
                    null
                  )
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-400 transition hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <SelectField
                label="Serviço"
                value={
                  editServiceId
                }
                onChange={(
                  value
                ) => {
                  setEditServiceId(
                    value
                  );

                  setEditTime(
                    ""
                  );
                }}
                options={services.map(
                  (service) => ({
                    value:
                      service._id,

                    label:
                      `${service.name} - ${formatPrice(
                        service.price
                      )}`,
                  })
                )}
                placeholder="Selecione um serviço"
              />

              <SelectField
                label="Profissional"
                value={
                  editProfessionalId
                }
                onChange={(
                  value
                ) => {
                  setEditProfessionalId(
                    value
                  );

                  setEditTime(
                    ""
                  );
                }}
                options={professionals.map(
                  (
                    professional
                  ) => ({
                    value:
                      professional._id,

                    label:
                      professional.name,
                  })
                )}
                placeholder="Selecione um profissional"
              />

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Data
                </label>

                <input
                  type="date"
                  min={
                    todaySaoPaulo()
                  }
                  value={
                    editDate
                  }
                  onChange={(
                    event
                  ) => {
                    setEditDate(
                      event.target.value
                    );

                    setEditTime(
                      ""
                    );
                  }}
                  className="min-h-[48px] w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Horário
                  </label>

                  {editLoadingAvailability ? (
                    <span className="text-xs text-zinc-500">
                      Buscando...
                    </span>
                  ) : null}
                </div>

                {!editServiceId ||
                !editProfessionalId ||
                !editDate ? (
                  <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                    Selecione serviço, profissional e data.
                  </div>
                ) : editSlots.length ===
                  0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">
                    {editAvailabilityMessage ||
                      "Nenhum horário disponível."}
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {editSlots.map(
                      (
                        slot
                      ) => (
                        <button
                          type="button"
                          key={`${slot.time}-${slot.endTime}`}
                          onClick={() =>
                            setEditTime(
                              slot.time
                            )
                          }
                          className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                            editTime ===
                            slot.time
                              ? "border-emerald-500 bg-emerald-500 text-zinc-950"
                              : "border-white/10 bg-[#071018] text-zinc-300 hover:border-emerald-500/40"
                          }`}
                        >
                          {slot.time}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {message ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
                  {message}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    editSaving
                  }
                  onClick={() =>
                    setEditingAppointment(
                      null
                    )
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    editSaving ||
                    !editServiceId ||
                    !editProfessionalId ||
                    !editDate ||
                    !editTime
                  }
                  onClick={
                    saveEditedAppointment
                  }
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {editSaving
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedAppointmentAction ? (
        <AppointmentActionSheet
          appointment={
            selectedAppointmentAction
          }
          updating={
            updatingId ===
            selectedAppointmentAction._id
          }
          onClose={() =>
            setSelectedAppointmentAction(
              null
            )
          }
          onConfirm={() =>
            changeStatusFromSheet(
              selectedAppointmentAction,
              "confirmado"
            )
          }
          onConfirmWhatsApp={() =>
            confirmAndSendWhatsApp(
              selectedAppointmentAction
            )
          }
          onWhatsApp={() => {
            openWhatsAppConfirmation(
              selectedAppointmentAction
            );
          }}
          onComplete={() =>
            changeStatusFromSheet(
              selectedAppointmentAction,
              "concluido"
            )
          }
          onNoShow={() =>
            changeStatusFromSheet(
              selectedAppointmentAction,
              "faltou"
            )
          }
          onCancel={() =>
            changeStatusFromSheet(
              selectedAppointmentAction,
              "cancelado"
            )
          }
          onEdit={() =>
            openEditAppointment(
              selectedAppointmentAction
            )
          }
          onReceipt={() =>
            generateReceipt(
              selectedAppointmentAction
            )
          }
        />
      ) : null}
    </main>
  );
}

function AppointmentCard({
  appointment,
  updating,
  onOpen,
}: {
  appointment: Appointment;
  updating: boolean;
  onOpen: () => void;
}) {
  const status =
    normalizeStatus(
      appointment.status
    );

  const membershipBalance =
    appointment.membershipUsageConsumed
      ? appointment.membershipRemainingAfter
      : appointment.membershipRemainingBefore;

  return (
    <button
      type="button"
      onClick={
        onOpen
      }
      disabled={
        updating
      }
      className="w-full rounded-2xl border border-white/10 bg-black/10 p-4 text-left transition hover:border-emerald-500/30 hover:bg-white/[0.035] disabled:opacity-60 sm:p-5"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex min-w-[76px] shrink-0 flex-col items-center justify-center rounded-xl border border-white/10 bg-[#071018] px-3 py-3">
          <span className="text-base font-black text-white">
            {appointment.time ||
              appointment.startTime ||
              "-"}
          </span>

          {appointment.endTime ? (
            <span className="mt-0.5 text-[11px] text-zinc-600">
              até {
                appointment.endTime
              }
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold sm:text-lg">
              {appointment.clientName ||
                "Cliente"}
            </h3>

            <StatusBadge
              status={
                status
              }
            />

            {appointment.hasActiveMembership ||
            appointment.membershipUsageConsumed ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                Mensalista
                {typeof membershipBalance ===
                "number"
                  ? ` • ${membershipBalance}`
                  : ""}
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 sm:text-sm">
            <span>
              {appointment.serviceName ||
                "Serviço"}
            </span>

            <span>
              {appointment.professionalName ||
                "Profissional"}
            </span>
          </div>

          {appointment.clientPhone ? (
            <p className="mt-1 text-xs text-zinc-600">
              {formatPhone(
                appointment.clientPhone
              )}
            </p>
          ) : null}
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-zinc-500">
          ⋯
        </div>
      </div>
    </button>
  );
}

function AppointmentActionSheet({
  appointment,
  updating,
  onClose,
  onConfirm,
  onConfirmWhatsApp,
  onWhatsApp,
  onComplete,
  onNoShow,
  onCancel,
  onEdit,
  onReceipt,
}: {
  appointment: Appointment;
  updating: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmWhatsApp: () => void;
  onWhatsApp: () => void;
  onComplete: () => void;
  onNoShow: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onReceipt: () => void;
}) {
  const status =
    normalizeStatus(
      appointment.status
    );

  const canChange =
    status !==
      "concluido" &&
    status !==
      "cancelado";

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-t-[28px] border border-white/10 bg-[#0c151e] shadow-2xl sm:mb-5 sm:rounded-3xl">
        <div className="flex justify-center pt-3">
          <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
        </div>

        <div className="border-b border-white/10 px-5 pb-5 pt-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-lg font-black">
                {appointment.professionalName ||
                  "Profissional"}{" "}
                •{" "}
                {appointment.time ||
                  appointment.startTime ||
                  "-"}
                {appointment.endTime
                  ? `-${appointment.endTime}`
                  : ""}
              </p>

              <p className="mt-1 truncate text-sm text-zinc-500">
                {appointment.clientName ||
                  "Cliente"}{" "}
                •{" "}
                {appointment.serviceName ||
                  "Serviço"}
              </p>
            </div>

            <StatusBadge
              status={
                status
              }
            />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-3 py-3 sm:px-4">
          {status !==
            "concluido" &&
          status !==
            "cancelado" ? (
            <SheetAction
              icon="✎"
              title="Editar agendamento"
              description="Alterar serviço, profissional, data ou horário."
              disabled={
                updating
              }
              onClick={
                onEdit
              }
            />
          ) : null}

          {status ===
          "pendente" ? (
            <>
              <SheetAction
                icon="✓"
                title="Confirmar e enviar WhatsApp"
                description="Confirma o horário e abre a mensagem pronta."
                accent="emerald"
                disabled={
                  updating ||
                  !canSendWhatsApp(
                    appointment.clientPhone
                  )
                }
                onClick={
                  onConfirmWhatsApp
                }
              />

              <SheetAction
                icon="✓"
                title="Somente confirmar"
                description="Atualiza o status sem abrir o WhatsApp."
                disabled={
                  updating
                }
                onClick={
                  onConfirm
                }
              />
            </>
          ) : null}

          {status ===
          "confirmado" ? (
            <div className="mb-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-sm font-bold text-emerald-400">
                ✓ Agendamento confirmado
              </p>
            </div>
          ) : null}

          {canSendWhatsApp(
            appointment.clientPhone
          ) ? (
            <SheetAction
              icon="◉"
              title="Enviar mensagem no WhatsApp"
              description={
                appointment.clientPhone
                  ? formatPhone(
                      appointment.clientPhone
                    )
                  : undefined
              }
              accent="emerald"
              disabled={
                updating
              }
              onClick={
                onWhatsApp
              }
            />
          ) : null}

          <SheetAction
            icon="▤"
            title="Gerar recibo"
            description="Abre um recibo pronto para imprimir ou salvar em PDF."
            disabled={
              updating
            }
            onClick={
              onReceipt
            }
          />

          {canChange ? (
            <SheetAction
              icon="✓"
              title="Concluir atendimento"
              description="Marca o serviço como realizado."
              accent="emerald"
              disabled={
                updating
              }
              onClick={
                onComplete
              }
            />
          ) : null}

          {canChange &&
          status !==
            "faltou" ? (
            <SheetAction
              icon="!"
              title="Cliente faltou"
              description="Registra que o cliente não compareceu."
              disabled={
                updating
              }
              onClick={
                onNoShow
              }
            />
          ) : null}

          {status !==
            "concluido" &&
          status !==
            "cancelado" ? (
            <SheetAction
              icon="×"
              title="Cancelar agendamento"
              description="Cancela este horário."
              accent="red"
              disabled={
                updating
              }
              onClick={
                onCancel
              }
            />
          ) : null}

          {updating ? (
            <div className="px-4 py-4 text-center text-sm text-zinc-500">
              Salvando alteração...
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              updating
            }
            className="min-h-[48px] w-full rounded-xl border border-white/10 font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

function SheetAction({
  icon,
  title,
  description,
  accent,
  disabled,
  onClick,
}: {
  icon: string;
  title: string;
  description?: string;
  accent?: "emerald" | "red";
  disabled?: boolean;
  onClick: () => void;
}) {
  let iconStyle =
    "border-white/10 bg-white/5 text-zinc-300";

  let titleStyle =
    "text-white";

  if (
    accent ===
    "emerald"
  ) {
    iconStyle =
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (
    accent ===
    "red"
  ) {
    iconStyle =
      "border-red-500/20 bg-red-500/10 text-red-400";

    titleStyle =
      "text-red-400";
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        disabled
      }
      className="flex min-h-[68px] w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition hover:bg-white/[0.045] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-xl font-bold ${iconStyle}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`font-semibold ${titleStyle}`}
        >
          {title}
        </p>

        {description ? (
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {description}
          </p>
        ) : null}
      </div>

      <span className="text-xl text-zinc-700">
        ›
      </span>
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;

  value: string;

  onChange: (
    value: string
  ) => void;

  options: {
    value: string;
    label: string;
  }[];

  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-white/10 bg-[#071018] px-4 py-3 text-sm outline-none focus:border-emerald-500"
      >
        <option value="">
          {placeholder}
        </option>

        {options.map(
          (
            option
          ) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {option.label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-zinc-500">
        {label}
      </span>

      <strong className="max-w-[60%] text-right text-sm">
        {value}
      </strong>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  primary = false,
  danger = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  let style =
    "border-white/10 text-zinc-300 hover:bg-white/5";

  if (primary) {
    style =
      "border-emerald-500 bg-emerald-500 text-zinc-950 hover:bg-emerald-400";
  }

  if (danger) {
    style =
      "border-red-500/20 text-red-400 hover:bg-red-500/5";
  }

  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${style}`}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const labels: Record<
    string,
    string
  > = {
    pendente:
      "Pendente",
    confirmado:
      "Confirmado",
    em_atendimento:
      "Em atendimento",
    concluido:
      "Concluído",
    cancelado:
      "Cancelado",
    faltou:
      "Faltou",
  };

  let style =
    "bg-zinc-500/10 text-zinc-400";

  if (
    status ===
    "confirmado"
  ) {
    style =
      "bg-blue-500/10 text-blue-400";
  }

  if (
    status ===
    "em_atendimento"
  ) {
    style =
      "bg-amber-500/10 text-amber-400";
  }

  if (
    status ===
    "concluido"
  ) {
    style =
      "bg-emerald-500/10 text-emerald-400";
  }

  if (
    status ===
    "cancelado"
  ) {
    style =
      "bg-red-500/10 text-red-400";
  }

  if (
    status ===
    "faltou"
  ) {
    style =
      "bg-orange-500/10 text-orange-400";
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      {labels[
        status
      ] || status}
    </span>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <p className="text-sm text-zinc-400">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-12 text-center">
      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function escapeReceiptHtml(
  value: string
) {
  return String(
    value || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function getWhatsAppNumber(
  value?: string
) {
  const digits =
    String(
      value || ""
    ).replace(
      /\D/g,
      ""
    );

  /*
  Número brasileiro já com 55
  */
  if (
    digits.startsWith(
      "55"
    ) &&
    (
      digits.length ===
        12 ||
      digits.length ===
        13
    )
  ) {
    return digits;
  }

  /*
  DDD + número
  */
  if (
    digits.length ===
      10 ||
    digits.length ===
      11
  ) {
    return `55${digits}`;
  }

  return "";
}

function canSendWhatsApp(
  value?: string
) {
  return Boolean(
    getWhatsAppNumber(
      value
    )
  );
}

function openWhatsAppConfirmation(
  appointment: Appointment
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const number =
    getWhatsAppNumber(
      appointment.clientPhone
    );

  if (!number) {
    return;
  }

  const status =
    normalizeStatus(
      appointment.status
    );

  const confirmationText =
    status ===
    "confirmado"
      ? "Seu agendamento está confirmado ✅"
      : "Seu agendamento foi registrado ✅";

  const clientName =
    String(
      appointment.clientName ||
        ""
    ).trim();

  const greeting =
    clientName
      ? `Olá, ${clientName}!`
      : "Olá!";

  const serviceName =
    appointment.serviceName ||
    "Serviço";

  const professionalName =
    appointment.professionalName ||
    "Profissional";

  const date =
    appointment.date
      ? formatDate(
          appointment.date
        )
      : "-";

  const time =
    appointment.time ||
    appointment.startTime ||
    "-";

  const message = [
    greeting,
    "",
    confirmationText,
    "",
    `Serviço: ${serviceName}`,
    `Profissional: ${professionalName}`,
    `Data: ${date}`,
    `Horário: ${time}`,
    "",
    "Se precisar alterar seu horário, entre em contato conosco.",
  ].join(
    "\n"
  );

  const url =
    `https://wa.me/${number}?text=${encodeURIComponent(
      message
    )}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}

function formatPhone(
  value?: string
) {
  const digits =
    String(
      value || ""
    )
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        11
      );

  if (
    digits.length === 11
  ) {
    return `(${digits.slice(
      0,
      2
    )}) ${digits.slice(
      2,
      7
    )}-${digits.slice(
      7
    )}`;
  }

  if (
    digits.length === 10
  ) {
    return `(${digits.slice(
      0,
      2
    )}) ${digits.slice(
      2,
      6
    )}-${digits.slice(
      6
    )}`;
  }

  return (
    value ||
    ""
  );
}

function formatPhoneInput(
  value: string
) {
  const digits =
    value
      .replace(
        /\D/g,
        ""
      )
      .slice(
        0,
        11
      );

  if (
    digits.length <= 2
  ) {
    return digits
      ? `(${digits}`
      : "";
  }

  if (
    digits.length <= 6
  ) {
    return `(${digits.slice(
      0,
      2
    )}) ${digits.slice(
      2
    )}`;
  }

  if (
    digits.length <= 10
  ) {
    return `(${digits.slice(
      0,
      2
    )}) ${digits.slice(
      2,
      6
    )}-${digits.slice(
      6
    )}`;
  }

  return `(${digits.slice(
    0,
    2
  )}) ${digits.slice(
    2,
    7
  )}-${digits.slice(
    7
  )}`;
}

async function readJsonResponse(
  response: Response
): Promise<any> {
  const text =
    await response.text();

  if (!text.trim()) {
    if (response.ok) {
      return {};
    }

    throw new Error(
      `A API respondeu sem conteúdo. Status ${response.status}.`
    );
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    throw new Error(
      `A API não retornou JSON válido. Status ${response.status}.`
    );
  }
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

function normalizeStatus(
  value?: string
) {
  const status =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  switch (status) {
    case "pending":
      return "pendente";

    case "confirmed":
      return "confirmado";

    case "completed":
      return "concluido";

    case "cancelled":
      return "cancelado";

    default:
      return status ||
        "pendente";
  }
}

function buildCalendar(
  monthValue: string
): CalendarDay[] {
  const [
    year,
    month,
  ] = monthValue
    .split("-")
    .map(Number);

  if (
    !year ||
    !month
  ) {
    return [];
  }

  const firstDay =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12
      )
    );

  const firstWeekDay =
    firstDay.getUTCDay();

  const calendarStart =
    new Date(
      firstDay
    );

  calendarStart.setUTCDate(
    calendarStart.getUTCDate() -
      firstWeekDay
  );

  const today =
    todaySaoPaulo();

  const days: CalendarDay[] =
    [];

  for (
    let index = 0;
    index < 42;
    index++
  ) {
    const current =
      new Date(
        calendarStart
      );

    current.setUTCDate(
      calendarStart.getUTCDate() +
        index
    );

    const dateString =
      `${current.getUTCFullYear()}-${String(
        current.getUTCMonth() +
          1
      ).padStart(
        2,
        "0"
      )}-${String(
        current.getUTCDate()
      ).padStart(
        2,
        "0"
      )}`;

    days.push({
      date:
        dateString,

      day:
        current.getUTCDate(),

      currentMonth:
        current.getUTCMonth() ===
        month - 1,

      isToday:
        dateString ===
        today,

      past:
        dateString <
        today,
    });
  }

  return days;
}

function changeMonth(
  monthValue: string,
  amount: number
) {
  const [
    year,
    month,
  ] = monthValue
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12
      )
    );

  date.setUTCMonth(
    date.getUTCMonth() +
      amount
  );

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() +
      1
  ).padStart(
    2,
    "0"
  )}`;
}

function changeDay(
  value: string,
  amount: number
) {
  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
      amount
  );

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() +
      1
  ).padStart(
    2,
    "0"
  )}-${String(
    date.getUTCDate()
  ).padStart(
    2,
    "0"
  )}`;
}

function todaySaoPaulo() {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    );

  const parts =
    formatter.formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "year"
    )?.value;

  const month =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "month"
    )?.value;

  const day =
    parts.find(
      (
        part
      ) =>
        part.type ===
        "day"
    )?.value;

  return `${year}-${month}-${day}`;
}

function formatDate(
  value?: string
) {
  if (!value) {
    return "-";
  }

  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-"
    );

  return `${day}/${month}/${year}`;
}

function formatMonthLabel(
  value: string
) {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
  ] = value
    .split("-")
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        1,
        12
      )
    );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month:
        "long",
      year:
        "numeric",
      timeZone:
        "UTC",
    }
  ).format(date);
}

function formatPrice(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    value || 0
  );
}