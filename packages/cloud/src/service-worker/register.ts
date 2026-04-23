(() => {
  var KEY = "__CLOUD_SW_REGISTERED__";
  var STATE_KEY = "__CLOUD_SW_STATE__";
  var PATH = "/sw.js";

  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) {
    console.warn("[CloudImage] Service Workers not supported");
    return;
  }
  if (window[KEY]) return;

  window[KEY] = true;

  navigator.serviceWorker
    .register(PATH)
    .then((reg) => {
      window[STATE_KEY] = "registered";
      console.log("[CloudImage] Service Worker registered (manual):", reg.scope);
    })
    .catch((err) => {
      window[STATE_KEY] = "failed";
      console.error("[CloudImage] Registration failed:", err.message);
    });
})();
