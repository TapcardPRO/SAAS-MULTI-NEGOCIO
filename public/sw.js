self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "Você tem uma atualização na Vellto." };
  }

  const title = data.title || "Novo agendamento · Vellto";
  const options = {
    body: data.body || "Um novo agendamento foi recebido.",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: data.url || "/dashboard/agenda" },
    tag: data.tag || "vellto-new-appointment",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/dashboard/agenda",
    self.location.origin
  ).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow(target);
    })
  );
});
