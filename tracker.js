(function () {
  "use strict";

  const API =
    "https://fqlvmijuolgacdqlavfk.supabase.co/functions/v1/analytics-tracker";

  const dominios = [
    "www.pymecenter.com.ar",
    "pymecenter.com.ar"
  ];

  if (!dominios.includes(location.hostname)) return;
  if (window.__pymecenterAnalytics) return;

  window.__pymecenterAnalytics = true;

  let visitante;
  let sesion;

  try {
    if (localStorage.getItem("pca_excluir") === "1") return;

    visitante = localStorage.getItem("pca_visitante");

    if (!visitante) {
      visitante = crypto.randomUUID();
      localStorage.setItem("pca_visitante", visitante);
    }

    sesion = sessionStorage.getItem("pca_sesion");

    const ultima = Number(
      sessionStorage.getItem("pca_actividad") || 0
    );

    if (!sesion || Date.now() - ultima > 1800000) {
      sesion = crypto.randomUUID();
      sessionStorage.setItem("pca_sesion", sesion);
    }

  } catch {
    return;
  }

  let origen = "";

  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);

      if (!dominios.includes(ref.hostname)) {
        origen = ref.origin;
      }
    }
  } catch {}

  function registrar(tipo, detalle = "") {
    try {
      const ultima = Number(
        sessionStorage.getItem("pca_actividad") || 0
      );

      if (Date.now() - ultima > 1800000) {
        sesion = crypto.randomUUID();
        sessionStorage.setItem("pca_sesion", sesion);
      }

      sessionStorage.setItem(
        "pca_actividad",
        String(Date.now())
      );
    } catch {}

    const datos = {
      visitante,
      sesion,
      tipo,
      pagina: location.pathname,
      titulo: document.title,
      origen,
      detalle
    };

    fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos),
      keepalive: true,
      credentials: "omit"
    }).catch(() => {});
  }

  // Registrar la visita inicial
  registrar("pageview");

  // Detectar navegación interna
  let paginaAnterior = location.pathname;

  setInterval(() => {
    if (location.pathname !== paginaAnterior) {
      paginaAnterior = location.pathname;
      registrar("pageview");
    }
  }, 1000);

  // Visitantes activos
  setInterval(() => {
    if (document.visibilityState === "visible") {
      registrar("heartbeat");
    }
  }, 60000);

  // Detectar interacciones comerciales
  document.addEventListener("click", function (e) {

    if (!(e.target instanceof Element)) return;

    const enlace = e.target.closest("a, button");

    if (!enlace) return;

    const href = enlace.getAttribute("href") || "";
    const texto = (enlace.textContent || "").toLowerCase();

    if (/wa\.me|whatsapp/i.test(href)) {
      registrar("whatsapp", "Clic en WhatsApp");
    }

    else if (/planes|precios/i.test(href + " " + texto)) {
      registrar("planes", "Consulta de planes");
    }

    else if (/contacto/i.test(href + " " + texto)) {
      registrar("contacto", "Consulta de contacto");
    }

  });

  // Detectar reproduccion de videos
  document.addEventListener("play", function (e) {
    if (e.target instanceof HTMLVideoElement) {
      registrar("video", "Reproduccion de video");
    }
  }, true);

  // Detectar intento de envio de formularios
  document.addEventListener("submit", function () {
    registrar("contacto", "Intento de envio de formulario");
  });

})();
