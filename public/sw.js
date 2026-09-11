self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "Lumio";
  const options = {
    body: data.body ?? "Your tutor is ready.",
    icon: data.icon ?? "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url ?? "/school" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/school";
  event.waitUntil(clients.openWindow(url));
});
