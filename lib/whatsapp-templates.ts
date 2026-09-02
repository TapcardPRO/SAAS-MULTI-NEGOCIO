type AppointmentMessageData = {
  businessName: string;
  clientName: string;
  serviceName: string;
  professionalName: string;
  date: string;
  time: string;
};

export function appointmentConfirmationMessage(
  data: AppointmentMessageData
) {
  return [
    `Olá, ${firstName(
      data.clientName
    )}! 👋`,
    "",
    `Seu horário na ${data.businessName} está confirmado.`,
    "",
    `📅 ${formatDate(
      data.date
    )}`,
    `⏰ ${data.time}`,
    `✂️ ${data.serviceName}`,
    `👤 ${data.professionalName}`,
    "",
    "Até lá! 😊",
  ].join(
    "\n"
  );
}

export function appointmentReminderMessage(
  data: AppointmentMessageData
) {
  return [
    `Olá, ${firstName(
      data.clientName
    )}!`,
    "",
    `Passando para lembrar do seu horário na ${data.businessName}.`,
    "",
    `📅 ${formatDate(
      data.date
    )}`,
    `⏰ ${data.time}`,
    `✂️ ${data.serviceName}`,
    `👤 ${data.professionalName}`,
    "",
    "Te esperamos! 🙂",
  ].join(
    "\n"
  );
}

export function appointmentCancellationMessage(
  data: AppointmentMessageData
) {
  return [
    `Olá, ${firstName(
      data.clientName
    )}.`,
    "",
    `Seu horário na ${data.businessName} foi cancelado.`,
    "",
    `📅 ${formatDate(
      data.date
    )}`,
    `⏰ ${data.time}`,
    "",
    "Quando quiser, você pode realizar um novo agendamento.",
  ].join(
    "\n"
  );
}

export function afterServiceMessage(
  data: AppointmentMessageData
) {
  return [
    `Olá, ${firstName(
      data.clientName
    )}!`,
    "",
    `Obrigado pela preferência na ${data.businessName}. 💚`,
    "",
    "Esperamos que tenha gostado do atendimento.",
    "",
    "Quando precisar, estaremos por aqui!",
  ].join(
    "\n"
  );
}

function firstName(
  value: string
) {
  return String(
    value ||
      "Cliente"
  )
    .trim()
    .split(
      /\s+/
    )[0];
}

function formatDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    String(
      value ||
        ""
    ).split(
      "-"
    );

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}
