const path = window.location.pathname;

const isInPages = path.includes("/pages/") || path.includes("\\pages\\");

const basePath = isInPages ? "../" : "./";

const MINIMUM_LOADING_TIME = 120;
const MAXIMUM_LOADING_TIME = 1200;

async function loadComponent(id, file) {
    const container = document.getElementById(id);

    if (!container) return false;

    try {
        const response = await fetch(file);

        if (!response.ok) {
            throw new Error(`Erro ao carregar componente: ${file}`);
        }

        const html = await response.text();

        container.innerHTML = html;

        return true;
    } catch (error) {
        console.error(error);

        return false;
    }
}

async function loadLayoutComponents() {
    /* =========================
       HEADER / FOOTER
    ========================= */

    await Promise.all([
        loadComponent("header-container", `${basePath}components/header.html`),
        loadComponent("footer-container", `${basePath}components/footer.html`),
    ]);
}

function moveMenuToBody() {
    /* =========================
       MENU FORA DO HEADER
       evita blur/filter herdado
    ========================= */

    const nav = document.querySelector(".links_header");

    if (!nav) return;

    document.body.appendChild(nav);
}

function applyLogoPaths() {
    /* =========================
       LOGO
    ========================= */

    document.querySelectorAll("[data-logo-branca]").forEach((img) => {
        img.src = `${basePath}assets/images/logo/logo-branca.png`;
    });

    document.querySelectorAll("[data-logo-colorida]").forEach((img) => {
        img.src = `${basePath}assets/images/logo/logo-colorida.png`;
    });
}

function applyIconPaths() {
    /* =========================
       ICONES
    ========================= */

    document.querySelectorAll("[data-icon]").forEach((img) => {
        img.src = `${basePath}assets/icons/${img.dataset.icon}`;
    });
}

function applyHomeLinks() {
    /* =========================
       LINK HOME
    ========================= */

    document.querySelectorAll("[data-home-link]").forEach((link) => {
        link.href = `${basePath}index.html`;
    });
}

function applyPageLinks() {
    /* =========================
       LINKS DAS PAGINAS
    ========================= */

    document.querySelectorAll("[data-page-link]").forEach((link) => {
        link.href = `${basePath}pages/${link.dataset.pageLink}`;
    });
}

function filterMenuLinks() {
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
}

function applyMenuCascade() {
    /* =========================
       CASCATA SOMENTE NOS VISÍVEIS
    ========================= */

    const visibleItems = Array.from(
        document.querySelectorAll(".links_header ul li"),
    ).filter((item) => !item.hidden);

    visibleItems.forEach((item, index) => {
        item.style.setProperty("--delay", `${index * 0.08}s`);
    });
}

function loadMenuScript() {
    /* =========================
       MENU JS
    ========================= */

    if (document.querySelector("[data-menu-script]")) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const menuScript = document.createElement("script");

        menuScript.src = `${basePath}js/menu.js`;
        menuScript.dataset.menuScript = "true";

        menuScript.addEventListener("load", () => resolve(true), {
            once: true,
        });

        menuScript.addEventListener(
            "error",
            () => {
                console.error(`Erro ao carregar script: ${menuScript.src}`);
                resolve(false);
            },
            { once: true },
        );

        document.body.appendChild(menuScript);
    });
}

function waitForLayoutReady() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

function waitForWindowLoad() {
    if (document.readyState === "complete") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        window.addEventListener("load", resolve, { once: true });
    });
}

function waitForMinimumLoadingTime(startTime) {
    const elapsedTime = Date.now() - startTime;

    const remainingTime = Math.max(MINIMUM_LOADING_TIME - elapsedTime, 0);

    return new Promise((resolve) => {
        setTimeout(resolve, remainingTime);
    });
}

function waitForMaximumLoadingTime(startTime) {
    const elapsedTime = Date.now() - startTime;

    const remainingTime = Math.max(MAXIMUM_LOADING_TIME - elapsedTime, 0);

    return new Promise((resolve) => {
        setTimeout(resolve, remainingTime);
    });
}

async function init() {
    await loadLayoutComponents();

    moveMenuToBody();
    applyLogoPaths();
    applyIconPaths();
    applyHomeLinks();
    applyPageLinks();
    filterMenuLinks();
    applyMenuCascade();
    await loadMenuScript();
    await waitForLayoutReady();
}

async function startApp() {
    const startTime = Date.now();

    try {
        await init();

        await Promise.all([
            waitForMinimumLoadingTime(startTime),
            Promise.race([
                waitForWindowLoad(),
                waitForMaximumLoadingTime(startTime),
            ]),
        ]);
    } catch (error) {
        console.error(error);
    } finally {
        window.hideLoading?.();
    }
}

startApp();
