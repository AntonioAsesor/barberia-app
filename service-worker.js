self.addEventListener("install", (e) => {
  console.log("🛠️ Instalando service worker...");
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  console.log("🚀 Activando service worker...");
});

self.addEventListener("fetch", (e) => {
  // 🔁 Para que funcione offline básico (aunque no cachee nada aún)
});
