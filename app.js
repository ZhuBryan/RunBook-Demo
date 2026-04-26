const nav = document.getElementById("rb-nav-list");
const navButtons = Array.from(document.querySelectorAll(".rb-nav"));
const views = Array.from(document.querySelectorAll(".rb-view"));
let rolloutPercent = 75;

function toast(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText =
    "position:fixed;top:14px;right:14px;z-index:2147483646;background:#111827;color:#e5e7eb;border:1px solid #374151;padding:10px 12px;border-radius:10px;font:12px/1.3 system-ui;";
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1800);
}

function activate(view) {
  navButtons.forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  views.forEach((v) => v.classList.toggle("active", v.dataset.view === view));
}

nav?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.dataset.view) return;
  activate(target.dataset.view);
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;

  if (target.dataset.view) return;

  const action = target.dataset.action || "";
  if (action === "manage-github" || action === "manage-slack") {
    toast("Opened integration settings.");
    return;
  }
  if (action === "connect-salesforce") {
    const status = target.parentElement?.querySelector("p.text-amber-300");
    if (status) {
      status.textContent = "Connected";
      status.classList.remove("text-amber-300");
      status.classList.add("text-emerald-300");
      target.textContent = "Manage";
      target.dataset.action = "manage-salesforce";
      toast("Salesforce connected.");
    }
    return;
  }
  if (action === "pause-rollout") {
    toast("Rollout paused.");
    return;
  }
  if (action === "rollback-now") {
    rolloutPercent = 35;
    const fill = document.querySelector(".h-2.w-3\\/4.rounded-full.bg-emerald-400");
    if (fill instanceof HTMLElement) fill.style.width = `${rolloutPercent}%`;
    toast("Rollback started.");
    return;
  }

  const label = (target.textContent || "").trim().toLowerCase();
  if (label.includes("new workflow") || label.includes("open full builder")) {
    activate("workflows");
    toast("Opened workflows.");
    return;
  }
  if (label.includes("manage keys") || label.includes("generate key")) {
    activate("api-keys");
    toast("Opened API keys.");
    return;
  }
  if (label.includes("release automation") || label.includes("incident alert routing") || label.includes("issue triage assistant")) {
    activate("workflows");
    toast("Template selected.");
    return;
  }
});
