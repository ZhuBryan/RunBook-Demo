const nav = document.getElementById("rb-nav-list");
const navButtons = Array.from(document.querySelectorAll(".rb-nav"));
const views = Array.from(document.querySelectorAll(".rb-view"));

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
