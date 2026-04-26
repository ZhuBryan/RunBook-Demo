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
    return;
  }

  if (action === "go-api-keys") {
    activate("api-keys");
    return;
  }

  if (action === "start-blank-workflow") {
    activate("workflows");
    setBuilderState("Manual trigger", "always true", "Notify Slack + create Jira ticket");
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
    toast("Rollout paused.");
    return;
  }

  if (action === "rollback-now") {
    updateRollout(35, "Rollback in progress · Restoring stable release");
    addDeployHistory("v1.43.0 · Rollback started · just now");
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
    toast("API key generated.");
  });
}
