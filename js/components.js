async function loadComponent(id, file) {
    const response = await fetch(file);
    const html = await response.text();

    document.getElementById(id).innerHTML = html;
}

const isInPages = window.location.pathname.includes("/pages/");
const basePath = isInPages ? "../" : "./";

async function init() {
    await loadComponent(
        "header-container",
        `${basePath}components/header.html`,
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
