/*
 * Adaptive Learning Platform — Shared Shell
 * Sticky header (brand + role nav + actions), mobile drawer, theme toggle,
 * SVG icon library, toast helper.
 */
(function () {
  "use strict";

  const I = {
    menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    search: '<circle cx="11" cy="11" r="7.5"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>',
    bell: '<path d="M19 8a6 6 0 0 0-12 0c0 4.8 3.6 4.8 3.6 9h3.6a1 1 0 0 0 1-1v-8z"/><path d="M7 8a6 6 0 0 1 12 0c0-4.8-3.6-4.8-3.6-9h-3.6a1 1 0 0 1-1 1v8z"/>',
    theme: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 14v2M1 12h2m18 12h-2M4.2 4.2l1.4 1.4m12.8 12.8-1.4 1.4M4.2 19.8l1.4-1.4m12.8-12.8-1.4-1.4"/>',
    mic: '<path d="M9 10v9a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-3a1 1 0 0 0 0-1.4 1 1 0 0 0-1.4 0l1-1a4 4 0 0 0 3 1.12V10z"/><path d="M10 1.9a3.5 3.5 0 0 1 7 0"/><path d="M17.4 4A8 8 0 0 1 8 4"/>',
    camera: '<path d="M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3"/>',
    screenShare: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 17v3h10v-3"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z"/>',
    whiteboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h8M6 11h5M6 14h5"/>',
    fullscreen: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
    exitFullscreen: '<polyline points="9 12 3 6 3 12"/><polyline points="3 6h6M21 12v6"/><line x1="3" y1="12" x2="9" y2="6"/><line x1="3" y1="12" x2="9" y2="18"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    pause: '<rect x="5" y="3" width="4" height="18" rx="1"/><rect x="13" y="3" width="4" height="18" rx="1"/>',
    playCircle: '<circle cx="12" cy="12" r="10"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
    volume: '<path d="M3 14h5v7L9 18H3z"/>',
    volumeMute: '<path d="M16.5 5l2 2L14 13l-2-2 8.5-4.5z"/><path d="M13 13l3 3L5 19l3-3z"/>',
    cc: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M11 10h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/><path d="M6 10h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
    save: '<path d="M4 5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9l-2-2H5a2 2 0 0 1-2-2V7z"/><path d="M7 5v3a1 1 0 0 0 2 0V6h2v3a2 2 0 0 1-2 2 2 2 0 0 1-2-2V5z"/><path d="M9 13a1 1 0 0 0 2 0H9zM9 13v3a2 2 0 0 1 4 0"/>',
    upload: '<polyline points="16 16 12 12 8 16"/><path d="M12 12v8"/><path d="M20 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3"/>',
    trash: '<path d="M3 6h16M19 6v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M10 18v-5"/>',
    warning: '<path d="M10.29 3.37L1.46 13a2 2 0 0 0 1.71 3h16a2 2 0 0 0 1.71-3l-8.83-9.63"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-12.95-8.66"/><polyline points="22 4 12 14.01 9 11.01"/>',
    trendingUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 17"/><polyline points="17 3h4v4"/>',
    arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowUp: '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    arrowDown: '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    chevronsRight: '<polyline points="13 17 20 10 13 3"/><polyline points="6 17 13 10 6 3"/>',
    chevronsLeft: '<polyline points="11 17 4 10 11 3"/><polyline points="18 17 11 10 18 3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  };

  function icon(inner, cls) {
    return '<svg class="icon' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"' +
      ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
  }

  const people = {
    student: { name: "Samira Patel", avatar: "SP", roleLabel: "Student", roleClass: "role-badge--student" },
    tutor: { name: "Maya Chen", avatar: "MC", roleLabel: "Tutor", roleClass: "role-badge--tutor" },
    parent: { name: "Roberto Sura", avatar: "RS", roleLabel: "Parent", roleClass: "role-badge--parent" },
    admin: { name: "Ada Lovelace", avatar: "AL", roleLabel: "Admin", roleClass: "role-badge--admin" },
  };

  const NAV = {
    student: [
      { label: "Dashboard", href: "student-dashboard.html", active: true },
      { label: "My Courses", href: "course-player.html" },
      { label: "Adaptive Quiz", href: "adaptive-quiz.html" },
      { label: "Social Feed", href: "social-feed.html" },
    ],
    tutor: [
      { label: "Portal", href: "tutor-onboarding.html", active: true },
      { label: "Class Arms", href: "tutor-onboarding.html#arms" },
      { label: "Grading Queue", href: "tutor-grading.html" },
    ],
    parent: [
      { label: "Sneak Peek", href: "parent-sneak-peek.html", active: true },
      { label: "Reports", href: "parent-sneak-peek.html#reports" },
    ],
    admin: [
      { label: "Console", href: "admin-console.html", active: true },
    ],
  };

  function init() {
    const role = document.body.dataset.role || "student";
    const person = people[role] || people.student;
    const nav = NAV[role] || [];

    const header = document.createElement("header");
    header.className = "app-header";
    header.innerHTML =
      '<button class="hamburger" id="hamburger" aria-label="Toggle navigation">' + icon(I.menu, "icon-sm") + "</button>" +
      '<a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true"></span>Adaptive Learning Platform</a>' +
      '<nav class="top-nav" aria-label="Main navigation">' +
      nav.map(i => '<a class="top-nav-link' + (i.active ? " is-active" : "") + '" href="' + i.href + '">' + i.label + "</a>").join("") +
      "</nav>" +
      '<div class="spacer"></div>' +
      '<div class="header-actions">' +
      '<label class="search-box" role="search"><span class="icon icon-sm" aria-hidden="true">' + I.search + '</span><input class="search-input" type="search" placeholder="Search courses, lessons..." aria-label="Search"/><span class="search-hint">/</span></label>' +
      '<button class="icon-btn" id="theme-toggle" title="Toggle dark mode" aria-label="Toggle dark mode">' + icon(I.theme) + "</button>" +
      '<button class="icon-btn has-badge" title="Notifications" aria-label="Notifications">' + icon(I.bell) + "<span class=\"dot\"></span></button>" +
      '<a class="avatar" href="index.html" title="Back to hub">' + person.avatar + "</a>" +
      "</div>";
    document.body.prepend(header);

    const footer = document.createElement("footer");
    footer.className = "app-footer";
    footer.innerHTML =
      '<div class="footer-links"><a href="index.html">Products</a><a href="index.html">Pricing</a><a href="index.html">About</a><a href="index.html">Privacy</a><a href="index.html">Terms</a></div>' +
      '<div class="footer-text">Adaptive Learning Platform · Desktop-first web prototype (Flutter mobile designs responsive-first)</div>';
    document.body.appendChild(footer);

    document.body.classList.add("app-body");

    const stored = localStorage.getItem("al-theme");
    if (stored === "dark") document.documentElement.dataset.theme = "dark";
    document.getElementById("theme-toggle").addEventListener("click", () => {
      if (document.documentElement.dataset.theme === "dark") {
        document.documentElement.dataset.theme = "light";
        localStorage.setItem("al-theme", "light");
      } else {
        document.documentElement.dataset.theme = "dark";
        localStorage.setItem("al-theme", "dark");
      }
    });

    const navEl = header.querySelector(".top-nav");
    header.querySelector("#hamburger").addEventListener("click", () => navEl.classList.toggle("is-open"));
  }

  function toast(message, kind) {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.id = "toast-stack";
      document.body.appendChild(stack);
    }
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " toast--" + kind : "");
    t.innerHTML = '<span>' + icon(I.checkCircle) + '</span><span>' + message + "</span>";
    stack.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 320); }, 3000);
  }

  document.addEventListener("DOMContentLoaded", init);

  window.A = {
    icons: Object.fromEntries(Object.entries(I).map(([k, v]) => [k, icon(v)])),
    rawIcons: I,
    people,
    NAV,
    icon,
    toast,
  };
})();
