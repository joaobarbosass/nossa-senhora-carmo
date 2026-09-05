const path = window.location.pathname;

const isInPages = path.includes("/pages/") || path.includes("\\pages\\");

const basePath = isInPages ? "../" : "./";

const MINIMUM_LOADING_TIME = 650;
const MAXIMUM_LOADING_TIME = 1200;
const ESSENTIAL_IFRAME_TIMEOUT = 1500;

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

function applyFooterAnchorLinks() {
    /* =========================
       LINKS DO FOOTER
    ========================= */

    document.querySelectorAll("[data-footer-anchor]").forEach((link) => {
        const anchor = link.dataset.footerAnchor;

        link.href = isInPages ? `${basePath}index.html#${anchor}` : `#${anchor}`;
    });
}

function applyFooterLocationLink() {
    /* =========================
       LOCALIZACAO DO FOOTER
    ========================= */

    const locationLink = document.querySelector("[data-footer-location]");
    const matriz = window.igrejasComunidades?.find(
        (comunidade) => comunidade.id === "matriz",
    );

    if (!locationLink || !matriz?.googleMaps) return;

    locationLink.href = matriz.googleMaps;
    locationLink.hidden = false;
}

function applyCurrentYear() {
    /* =========================
       ANO ATUAL
    ========================= */

    document.querySelectorAll("[data-current-year]").forEach((element) => {
        element.textContent = new Date().getFullYear();
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

function waitForHeroReady() {
    const hero = document.querySelector("[data-hero-carousel]");

    if (!hero || hero.dataset.heroReady === "true") {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const timeout = setTimeout(resolve, 1800);

        window.addEventListener(
            "hero-carousel-ready",
            () => {
                clearTimeout(timeout);
                resolve();
            },
            { once: true },
        );
    });
}

function waitForImageSource(src) {
    if (!src) return Promise.resolve();

    return new Promise((resolve) => {
        const image = new Image();

        image.decoding = "async";

        const finish = () => {
            if (image.complete && image.naturalWidth > 0) {
                if (typeof image.decode === "function") {
                    image.decode().catch(() => {}).finally(resolve);
                } else {
                    resolve();
                }

                return;
            }

            resolve();
        };

        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", resolve, { once: true });
        image.src = src;

        if (image.complete) {
            finish();
        }
    });
}

function getEssentialImageSources() {
    const sources = new Set();

    (window.igrejasComunidades || []).forEach((comunidade) => {
        if (comunidade.imagemPrincipal) {
            sources.add(comunidade.imagemPrincipal);
        }
    });

    document
        .querySelectorAll(
            ".impossible-mass__saint img, .parish-priest__photo img",
        )
        .forEach((image) => {
            const src = image.currentSrc || image.getAttribute("src");

            if (src) {
                sources.add(src);
            }
        });

    return Array.from(sources);
}

function waitForEssentialImages() {
    const sources = getEssentialImageSources();

    if (!sources.length) {
        return Promise.resolve();
    }

    return Promise.all(sources.map(waitForImageSource));
}

function waitForIframeLoad(iframe) {
    return new Promise((resolve) => {
        const timeout = setTimeout(resolve, ESSENTIAL_IFRAME_TIMEOUT);

        iframe.addEventListener(
            "load",
            () => {
                clearTimeout(timeout);
                resolve();
            },
            { once: true },
        );
    });
}

function waitForEssentialIframes() {
    const iframes = Array.from(document.querySelectorAll(".page-video iframe"));

    if (!iframes.length) {
        return Promise.resolve();
    }

    return Promise.all(iframes.map(waitForIframeLoad));
}

async function init() {
    await loadLayoutComponents();

    moveMenuToBody();
    applyLogoPaths();
    applyIconPaths();
    applyHomeLinks();
    applyPageLinks();
    applyFooterAnchorLinks();
    applyFooterLocationLink();
    applyCurrentYear();
    filterMenuLinks();
    applyMenuCascade();
    await loadMenuScript();
    await waitForLayoutReady();
    await Promise.all([
        waitForEssentialImages(),
        waitForHeroReady(),
        waitForEssentialIframes(),
    ]);
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
