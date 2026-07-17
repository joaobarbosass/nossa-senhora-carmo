async function loadComponent(id, file) {
    const container = document.getElementById(id);

    if (!container) return;

    const response = await fetch(file);
    const html = await response.text();

    container.innerHTML = html;
}

const path = window.location.pathname;

const isInPages = path.includes("/pages/") || path.includes("\\pages\\");

const basePath = isInPages ? "../" : "./";

async function init() {
    /* =========================
       HEADER
    ========================= */

    await loadComponent(
        "header-container",
        `${basePath}components/header.html`,
    );

    /* =========================
       FOOTER
    ========================= */

    await loadComponent(
        "footer-container",
        `${basePath}components/footer.html`,
    );

    /* =========================
       MENU FORA DO HEADER
       evita blur/filter herdado
    ========================= */

    const nav = document.querySelector(".links_header");

    if (nav) {
        document.body.appendChild(nav);
    }

    /* =========================
       LOGO
    ========================= */

    document.querySelectorAll("[data-logo-branca]").forEach((img) => {
        img.src = `${basePath}assets/images/logo/logo-branca.png`;
    });

    document.querySelectorAll("[data-logo-colorida]").forEach((img) => {
        img.src = `${basePath}assets/images/logo/logo-colorida.png`;
    });

    /* =========================
       LINK HOME
    ========================= */

    document.querySelectorAll("[data-home-link]").forEach((link) => {
        link.href = `${basePath}index.html`;
    });

    /* =========================
       FILTRO DE LINKS POR PÁGINA
    ========================= */

    const currentPageType = isInPages ? "internal" : "home";

    const menuItems = document.querySelectorAll(
        ".links_header ul li[data-page]",
    );

    menuItems.forEach((item) => {
        const pageType = item.dataset.page;

        const show = pageType === "all" || pageType === currentPageType;

        item.hidden = !show;
    });

    /* =========================
       CASCATA SOMENTE NOS VISÍVEIS
    ========================= */

    const visibleItems = Array.from(
        document.querySelectorAll(".links_header ul li"),
    ).filter((item) => !item.hidden);

    visibleItems.forEach((item, index) => {
        item.style.setProperty("--delay", `${index * 0.08}s`);
    });

    /* =========================
       MENU JS
    ========================= */

    if (!document.querySelector("[data-menu-script]")) {
        const menuScript = document.createElement("script");

        menuScript.src = `${basePath}js/menu.js`;
        menuScript.dataset.menuScript = "true";

        document.body.appendChild(menuScript);
    }
}

async function startApp() {
    const startTime = Date.now();

    await init();

    const elapsedTime = Date.now() - startTime;

    const minimumLoadingTime = 300;

    const remainingTime = Math.max(minimumLoadingTime - elapsedTime, 0);

    setTimeout(() => {
        window.hideLoading?.();
    }, remainingTime);
}

startApp();
