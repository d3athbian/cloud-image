(() => {
  const KEY = "__CLOUD_SW_REGISTERED__";
  const STATE_KEY = "__CLOUD_SW_STATE__";
  const PATH = "/sw.js";
  const win = window as unknown as Record<string, unknown>;

  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) {
    console.warn("[CloudImage] Service Workers not supported");
    return;
  }
  if (win[KEY]) return;

  win[KEY] = true;

  navigator.serviceWorker
    .register(PATH)
    .then((reg) => {
      win[STATE_KEY] = "registered";
      console.log("[CloudImage] Service Worker registered (manual):", reg.scope);
    })
    .catch((err: Error) => {
      win[STATE_KEY] = "failed";
      console.error("[CloudImage] Registration failed:", err.message);
    });
})();
