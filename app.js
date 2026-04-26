const nav = document.getElementById("rb-nav-list");
const navButtons = Array.from(document.querySelectorAll(".rb-nav"));
const views = Array.from(document.querySelectorAll(".rb-view"));
const integrationDetail = document.getElementById("integrationDetail");
const deployFill = document.getElementById("deployFill");
const deployStatus = document.getElementById("deployStatus");
const deployHistory = document.getElementById("deployHistory");
const apiKeyForm = document.getElementById("apiKeyForm");
const apiKeyList = document.getElementById("apiKeyList");
const salesforceStatus = document.getElementById("salesforceStatus");
const wfTrigger = document.getElementById("wfTrigger");
const wfCondition = document.getElementById("wfCondition");
const wfAction = document.getElementById("wfAction");
const wfTriggerOverview = document.getElementById("wfTriggerOverview");
const wfConditionOverview = document.getElementById("wfConditionOverview");
const wfActionOverview = document.getElementById("wfActionOverview");

let rolloutPercent = 75;
const appState = {
  githubConnected: false,
  apiKeyCreated: false,
  workflowCreated: false,
  deployed: false,
};
let tourActive = false;
let tourStepIndex = 0;
let highlightedEl = null;
let pendingHighlightRetry = null;
let widgetEnabled = true;
let hoverEnabled = true;
const TOUR_STEPS = [
  {
    id: "connect-github",
    feature: "integrations",
    selector: "[data-tour-target='github-manage']",
    view: "integrations",
    title: "Connect integrations",
    description: "Open GitHub integration first.",
    done: () => appState.githubConnected,
  },
  {
    id: "create-api-key",
    feature: "api-keys",
    selector: "[data-tour-target='generate-api-key']",
    view: "api-keys",
    title: "Create API key",
    description: "Generate a staging API key.",
    done: () => appState.apiKeyCreated,
  },
  {
    id: "build-workflow",
    feature: "workflow-builder",
    selector: "[data-tour-target='new-workflow']",
    view: "overview",
    title: "Build first workflow",
    description: "Open workflow builder and load a starter.",
    done: () => appState.workflowCreated,
  },
  {
    id: "deploy-staging",
    feature: "deployments",
    selector: "[data-tour-target='deployment-card']",
    view: "deployments",
    title: "Deploy to staging",
    description: "Validate rollout status and deployment controls.",
    done: () => appState.deployed,
  },
];

function toast(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.cssText =
    "position:fixed;top:14px;right:14px;z-index:2147483646;background:#111827;color:#e5e7eb;border:1px solid #374151;padding:10px 12px;border-radius:10px;font:12px/1.3 system-ui;";
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 1800);
}

function ensureTourStyles() {
  if (document.getElementById("demo-tour-style")) return;
  const style = document.createElement("style");
  style.id = "demo-tour-style";
  style.textContent =
    ".demo-tour-highlight{outline:3px solid #a78bfa !important;outline-offset:2px;border-radius:10px;animation:demoTourPulse 1.1s ease-in-out infinite;}" +
    "@keyframes demoTourPulse{0%{box-shadow:0 0 0 0 rgba(167,139,250,.65);}100%{box-shadow:0 0 0 10px rgba(167,139,250,0);}}";
  document.head.appendChild(style);
}

function syncAppState() {
  window.__runbookAppState = { ...appState };
  window.dispatchEvent(new CustomEvent("runbook-app-state", { detail: { ...appState } }));
}

function clearHighlight() {
  if (pendingHighlightRetry) {
    window.clearTimeout(pendingHighlightRetry);
    pendingHighlightRetry = null;
  }
  if (highlightedEl) highlightedEl.classList.remove("demo-tour-highlight");
  highlightedEl = null;
}

function tryHighlightStep(step) {
  const target = document.querySelector(step.selector);
  if (target instanceof HTMLElement) {
    highlightedEl = target;
  } else {
    const byFeature = document.querySelector(`[data-runbook-feature="${step.feature}"]`);
    if (byFeature instanceof HTMLElement) highlightedEl = byFeature;
  }
  if (highlightedEl instanceof HTMLElement) {
    highlightedEl.classList.add("demo-tour-highlight");
    highlightedEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  }
  return false;
}

function firstIncompleteStepIndex() {
  const idx = TOUR_STEPS.findIndex((s) => !s.done());
  return idx >= 0 ? idx : TOUR_STEPS.length - 1;
}

function renderTourStep() {
  if (!tourActive) return;
  ensureTourStyles();
  clearHighlight();
  const step = TOUR_STEPS[tourStepIndex];
  if (!step) return;
  activate(step.view);
  const foundNow = tryHighlightStep(step);
  if (!foundNow) {
    pendingHighlightRetry = window.setTimeout(() => {
      if (!tourActive) return;
      clearHighlight();
      tryHighlightStep(step);
    }, 250);
  }
  window.dispatchEvent(
    new CustomEvent("runbook-active-feature", {
      detail: { feature: step.feature, title: step.title, description: step.description },
    }),
  );
  window.dispatchEvent(new CustomEvent("runbook-assistant-status", { detail: `Guiding: ${step.title}` }));
  const coach = document.getElementById("tourCoach");
  const title = document.getElementById("tourCoachTitle");
  const text = document.getElementById("tourCoachText");
  if (coach && title && text) {
    title.textContent = `Step ${tourStepIndex + 1}/${TOUR_STEPS.length}: ${step.title}`;
    text.textContent = `${step.description} You can complete it or skip this step.`;
    if (highlightedEl instanceof HTMLElement) {
      const rect = highlightedEl.getBoundingClientRect();
      const coachWidth = 280;
      const placeRight = rect.right + coachWidth + 20 <= window.innerWidth;
      const top = Math.min(window.innerHeight - 120, Math.max(12, rect.top));
      const left = placeRight ? rect.right + 10 : Math.max(12, rect.left - coachWidth - 10);
      coach.style.top = `${top}px`;
      coach.style.left = `${left}px`;
      coach.style.right = "auto";
      coach.style.bottom = "auto";
    }
    coach.style.display = "block";
  }
}

function maybeAdvanceTour() {
  if (!tourActive) return;
  const step = TOUR_STEPS[tourStepIndex];
  if (!step || !step.done()) return;
  if (tourStepIndex < TOUR_STEPS.length - 1) {
    tourStepIndex += 1;
    renderTourStep();
  } else {
    tourActive = false;
    clearHighlight();
    const coach = document.getElementById("tourCoach");
    if (coach) coach.style.display = "none";
    window.dispatchEvent(new CustomEvent("runbook-assistant-status", { detail: "Tour complete." }));
  }
}

function activate(view) {
  navButtons.forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  views.forEach((v) => v.classList.toggle("active", v.dataset.view === view));
}

function setBuilderState(trigger, condition, action) {
  if (wfTrigger) wfTrigger.textContent = trigger;
  if (wfCondition) wfCondition.textContent = condition;
  if (wfAction) wfAction.textContent = action;
  if (wfTriggerOverview) wfTriggerOverview.textContent = trigger;
  if (wfConditionOverview) wfConditionOverview.textContent = condition;
  if (wfActionOverview) wfActionOverview.textContent = action;
}

function setIntegrationDetail(title, lines) {
  if (!integrationDetail) return;
  const html = [
    `<p class="font-semibold text-slate-100">${title}</p>`,
    ...lines.map((line) => `<p class="mt-1 text-slate-300">${line}</p>`),
  ].join("");
  integrationDetail.innerHTML = html;
}

function addDeployHistory(text) {
  if (!(deployHistory instanceof HTMLUListElement)) return;
  const li = document.createElement("li");
  li.className = "rounded-lg bg-slate-950/70 px-3 py-2";
  li.textContent = text;
  deployHistory.prepend(li);
}

function updateRollout(percent, status) {
  rolloutPercent = percent;
  if (deployFill instanceof HTMLElement) deployFill.style.width = `${rolloutPercent}%`;
  if (deployStatus instanceof HTMLElement) deployStatus.textContent = status;
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

  if (action === "go-workflows") {
    activate("workflows");
    appState.workflowCreated = true;
    syncAppState();
    maybeAdvanceTour();
    return;
  }

  if (action === "go-api-keys") {
    activate("api-keys");
    return;
  }

  if (action === "start-blank-workflow") {
    activate("workflows");
    setBuilderState("Manual trigger", "always true", "Notify Slack + create Jira ticket");
    appState.workflowCreated = true;
    syncAppState();
    maybeAdvanceTour();
    toast("Blank workflow created.");
    return;
  }

  if (action === "use-template") {
    const template = target.dataset.template || "Template";
    activate("workflows");
    if (template === "Release automation") {
      setBuilderState("GitHub release tag", "tests_passed == true", "Deploy to production canary");
    } else if (template === "Support escalation") {
      setBuilderState("Zendesk priority update", "priority == urgent", "Page on-call + create incident timeline");
    } else {
      setBuilderState("New user signup", "plan == trial", "Create lifecycle tasks in CRM");
    }
    appState.workflowCreated = true;
    syncAppState();
    maybeAdvanceTour();
    toast(`${template} loaded.`);
    return;
  }

  if (action === "manage-github") {
    activate("integrations");
    setIntegrationDetail("GitHub Integration", [
      "Auth scope: repo, read:org, workflow",
      "Webhooks: push, pull_request, release",
      "Health: Receiving events successfully (last event 42s ago)",
    ]);
    appState.githubConnected = true;
    syncAppState();
    maybeAdvanceTour();
    return;
  }

  if (action === "manage-slack") {
    activate("integrations");
    setIntegrationDetail("Slack Integration", [
      "Connected workspace: RunBook Ops",
      "Channels: #deployments, #onboarding-assistant",
      "Health: Bot token valid, notifications delivered",
    ]);
    return;
  }

  if (action === "connect-salesforce") {
    if (salesforceStatus instanceof HTMLElement) {
      salesforceStatus.textContent = "Connected";
      salesforceStatus.classList.remove("text-amber-300");
      salesforceStatus.classList.add("text-emerald-300");
    }
    target.textContent = "Manage";
    target.dataset.action = "manage-salesforce";
    setIntegrationDetail("Salesforce Integration", [
      "Auth completed via OAuth2",
      "Objects synced: Accounts, Contacts, Opportunities",
      "Health: Initial sync in progress",
    ]);
    appState.githubConnected = true;
    syncAppState();
    maybeAdvanceTour();
    toast("Salesforce connected.");
    return;
  }

  if (action === "manage-salesforce") {
    activate("integrations");
    setIntegrationDetail("Salesforce Integration", [
      "Sync mode: incremental every 15 minutes",
      "Last sync: 3 minutes ago",
      "Health: No sync errors",
    ]);
    return;
  }

  if (action === "pause-rollout") {
    updateRollout(rolloutPercent, "Rollout paused · Waiting for manual resume");
    addDeployHistory(`v1.43.0 · Paused at ${rolloutPercent}% · just now`);
    appState.deployed = true;
    syncAppState();
    maybeAdvanceTour();
    toast("Rollout paused.");
    return;
  }

  if (action === "rollback-now") {
    updateRollout(35, "Rollback in progress · Restoring stable release");
    addDeployHistory("v1.43.0 · Rollback started · just now");
    appState.deployed = true;
    syncAppState();
    maybeAdvanceTour();
    toast("Rollback started.");
  }
});

if (apiKeyForm instanceof HTMLFormElement) {
  apiKeyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const keyNameInput = document.getElementById("keyName");
    const keyEnvInput = document.getElementById("keyEnv");
    if (!(keyNameInput instanceof HTMLInputElement)) return;
    if (!(keyEnvInput instanceof HTMLSelectElement)) return;

    const keyName = keyNameInput.value.trim() || "untitled";
    const keyEnv = keyEnvInput.value.trim();
    const masked = `rb_${Math.random().toString(36).slice(2, 8)}****`;
    const item = document.createElement("li");
    item.className = "flex items-center justify-between rounded-lg bg-slate-950/70 px-3 py-2";
    item.innerHTML = `<span>${keyName} (${keyEnv})</span><span class="text-slate-400">${masked}</span>`;
    if (apiKeyList instanceof HTMLUListElement) apiKeyList.prepend(item);

    keyNameInput.value = "";
    keyEnvInput.value = "Staging";
    appState.apiKeyCreated = true;
    syncAppState();
    maybeAdvanceTour();
    toast("API key generated.");
  });
}

window.addEventListener("runbook-start-tour", () => {
  tourActive = true;
  tourStepIndex = firstIncompleteStepIndex();
  renderTourStep();
});

window.addEventListener("runbook-what-next", () => {
  tourActive = true;
  tourStepIndex = firstIncompleteStepIndex();
  renderTourStep();
});

window.addEventListener("runbook-ui-action", (evt) => {
  const action = evt && evt.detail ? evt.detail : null;
  if (!action) return;
  if (action.type === "start_tour") {
    tourActive = true;
    tourStepIndex = firstIncompleteStepIndex();
    renderTourStep();
    return;
  }
  if (action.type === "start_step" && action.stepId) {
    const idx = TOUR_STEPS.findIndex((s) => s.id === action.stepId);
    if (idx >= 0) {
      tourActive = true;
      tourStepIndex = idx;
      renderTourStep();
    }
    return;
  }
  if (action.type === "highlight") {
    tourActive = false;
    const idx = TOUR_STEPS.findIndex((s) => s.feature === action.feature);
    if (idx >= 0) {
      tourStepIndex = idx;
      renderTourStep();
    }
  }
});

document.getElementById("tourSkipBtn")?.addEventListener("click", () => {
  if (tourStepIndex < TOUR_STEPS.length - 1) {
    tourStepIndex += 1;
    renderTourStep();
  } else {
    tourActive = false;
    clearHighlight();
    const coach = document.getElementById("tourCoach");
    if (coach) coach.style.display = "none";
    window.dispatchEvent(new CustomEvent("runbook-assistant-status", { detail: "Tour skipped." }));
  }
});

document.getElementById("toggleWidgetBtn")?.addEventListener("click", (evt) => {
  widgetEnabled = !widgetEnabled;
  window.dispatchEvent(new CustomEvent("runbook-widget-toggle", { detail: widgetEnabled }));
  if (evt.target instanceof HTMLButtonElement) evt.target.textContent = widgetEnabled ? "Widget: on" : "Widget: off";
});

document.getElementById("toggleHoverBtn")?.addEventListener("click", (evt) => {
  hoverEnabled = !hoverEnabled;
  window.dispatchEvent(new CustomEvent("runbook-hover-toggle", { detail: hoverEnabled }));
  if (evt.target instanceof HTMLButtonElement) evt.target.textContent = hoverEnabled ? "Hover notes: on" : "Hover notes: off";
});

syncAppState();
