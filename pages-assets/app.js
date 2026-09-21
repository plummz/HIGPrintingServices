(() => {
  "use strict";
  const key = "printflow-pages-preview-v1";
  const defaults = {
    name: "HIGP Printing Services",
    timeZone: "Asia/Manila",
    contact: "",
    hours: "",
    address: "",
  };
  const form = document.querySelector("#settings-form");
  const status = document.querySelector("#save-status");
  function render(data) {
    for (const [field, fallback] of Object.entries(defaults)) {
      const value = typeof data[field] === "string" ? data[field] : fallback;
      form.elements.namedItem(field).value = value;
    }
    document.querySelectorAll("[data-business-name]").forEach((el) => {
      el.textContent = form.elements.namedItem("name").value;
    });
    document.querySelector("#zone-summary").textContent =
      form.elements.namedItem("timeZone").value;
  }
  let initial = defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && typeof saved === "object") initial = saved;
  } catch {
    /* Storage may be unavailable. The preview still works in memory. */
  }
  render(initial);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.name = data.name.trim();
    if (data.name.length < 2) {
      status.textContent =
        "Enter a business name with at least two characters.";
      return;
    }
    render(data);
    window.PrintFlowMotion?.feedback(form);
    try {
      localStorage.setItem(key, JSON.stringify(data));
      status.textContent =
        "Preview settings saved in this browser. Nothing was sent to HIGP.";
    } catch {
      status.textContent =
        "Preview updated for this visit. Your browser blocked saving.";
    }
  });
  document.querySelector("#reset-preview").addEventListener("click", () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* Continue with in-memory reset. */
    }
    render(defaults);
    status.textContent = "Preview settings reset.";
  });
  let currentView;
  function navigate() {
    const route = location.hash.slice(1);
    const workspace = [
      "workspace",
      "workspace-main",
      "settings",
      "team",
    ].includes(route);
    document.querySelector("#home-view").hidden = workspace;
    document.querySelector("#workspace-view").hidden = !workspace;
    document.querySelector(".skip").href = workspace
      ? "#workspace-main"
      : "#main";
    document.title = workspace
      ? "Workspace preview | PrintFlow"
      : "HIGP Printing Services | PrintFlow";
    const nextView = workspace ? "workspace-view" : "home-view";
    if (currentView !== nextView) {
      window.PrintFlowMotion?.enter(document.getElementById(nextView));
      currentView = nextView;
    }
    document.querySelectorAll(".sidebar nav a").forEach((link) => {
      const active =
        link.hash ===
        (route === "workspace-main" ? "#workspace" : location.hash);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    const target = document.getElementById(route);
    if (workspace && route === "workspace") {
      window.scrollTo(0, 0);
      document.querySelector("#workspace-main").focus({ preventScroll: true });
    } else if (target) target.scrollIntoView();
    else if (route === "home") window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", navigate);
  navigate();
})();
