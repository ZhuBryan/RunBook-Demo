const navMenu = document.getElementById("navMenu");
const views = Array.from(document.querySelectorAll(".view"));
const activityFeed = document.getElementById("activityFeed");
const integrationCards = document.getElementById("integrationCards");
const apiKeyForm = document.getElementById("apiKeyForm");

const integrations = [
  { name: "GitHub", status: "Connected", detail: "PR events and release metadata." },
  { name: "Slack", status: "Connected", detail: "Approval prompts and deployment alerts." },
  { name: "PagerDuty", status: "Not connected", detail: "Incident escalation automation." },
  { name: "Salesforce", status: "Not connected", detail: "Lead lifecycle triggers." },
  { name: "Stripe", status: "Connected", detail: "Subscription and payment webhook events." },
  { name: "Zendesk", status: "Not connected", detail: "Ticket triage and SLA routing." }
];

function setView(nextView) {
  views.forEach((v) => v.classList.toggle("active-view", v.id === `view-${nextView}`));
  Array.from(navMenu.querySelectorAll(".nav-item")).forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.view === nextView)
  );
}

navMenu?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.dataset.view) return;
  setView(target.dataset.view);
});

function renderIntegrations() {
  if (!integrationCards) return;
  integrationCards.innerHTML = "";
  integrations.forEach((item) => {
    const card = document.createElement("article");
    card.className = "integration-card";
    card.setAttribute("data-runbook-feature", `integration-${item.name.toLowerCase()}`);
    card.setAttribute("data-runbook-title", `${item.name} Integration`);
    card.setAttribute(
      "data-runbook-description",
      `${item.name} is ${item.status.toLowerCase()} and handles ${item.detail.toLowerCase()}`
    );
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <strong>${item.name}</strong>
        <span class="${item.status === "Connected" ? "status-connected" : "status-disconnected"}">${item.status}</span>
      </div>
      <p class="subtle">${item.detail}</p>
      <button type="button" class="ghost-btn">${item.status === "Connected" ? "Manage" : "Connect"}</button>
    `;
    integrationCards.appendChild(card);
  });
}

apiKeyForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(apiKeyForm);
  const keyName = String(form.get("keyName") || "unnamed-key");
  const keyEnv = String(form.get("keyEnv") || "Staging");
  if (activityFeed) {
    const item = document.createElement("li");
    item.textContent = `API key "${keyName}" generated for ${keyEnv}`;
    activityFeed.prepend(item);
  }
  alert(`Generated key for ${keyName} (${keyEnv}).`);
});

document.getElementById("newWorkflowBtn")?.addEventListener("click", () => {
  setView("workflows");
});

document.getElementById("openCommandPaletteBtn")?.addEventListener("click", () => {
  alert("Command Palette: Try searching 'deploy', 'workflow', or 'integrations'.");
});

renderIntegrations();
