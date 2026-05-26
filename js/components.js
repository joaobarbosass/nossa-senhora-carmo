async function loadComponent(id, file) {
    const response = await fetch(file);
    const html = await response.text();

    document.getElementById(id).innerHTML = html;
}

const isInPages = window.location.pathname.includes("/pages/");
const basePath = isInPages ? "../" : "./";

async function init() {
    // HEADER
    await loadComponent(
        "header-container",
        `${basePath}components/header.html`,
    );

    // Move o menu para filho direto do body
    // para que não herde o filter/blur do header
    const nav = document.querySelector(".links_header");
    if (nav) document.body.appendChild(nav);

    // FOOTER
    await loadComponent(
        "footer-container",
        `${basePath}components/footer.html`,
    );

    // LOGO
    document.querySelectorAll("[data-logo]").forEach((img) => {
        img.src = `${basePath}assets/images/logo/logo-branca.png`;
    });

    // LINK HOME
    document.querySelectorAll("[data-home-link]").forEach((link) => {
        link.href = `${basePath}index.html`;
    });

    // MENU
    const menuScript = document.createElement("script");
    menuScript.src = `${basePath}js/menu.js`;

    document.body.appendChild(menuScript);
}

init();
