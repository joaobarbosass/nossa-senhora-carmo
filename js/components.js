async function loadComponent(id, file) {
    const container = document.getElementById(id);

    if (!container) return;

    const response = await fetch(file);
    const html = await response.text();

    container.innerHTML = html;
}

const isInPages = window.location.pathname.includes("/pages/");
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

    document.querySelectorAll("[data-logo]").forEach((img) => {
        img.src = `${basePath}assets/images/logo/logo-branca.png`;
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

        item.style.display = show ? "block" : "none";
    });

    /* =========================
       CASCATA SOMENTE NOS VISÍVEIS
    ========================= */

    const visibleItems = Array.from(
        document.querySelectorAll(".links_header ul li"),
    ).filter((item) => {
        return window.getComputedStyle(item).display !== "none";
    });

    visibleItems.forEach((item, index) => {
        item.style.transitionDelay = `${index * 0.08}s`;
    });

    /* =========================
       MENU JS
    ========================= */

    const menuScript = document.createElement("script");

    menuScript.src = `${basePath}js/menu.js`;

    document.body.appendChild(menuScript);
}

init();
