/* =============================================
   HEADER — menu.js
   ============================================= */

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".links_header");
const links = document.querySelectorAll(".links_header a");
const menuClose = document.querySelector(".menu-close");
const header = document.querySelector("header");

/* ----- OVERLAY escuro ----- */
const overlay = document.createElement("div");
overlay.className = "menu-overlay";
document.body.appendChild(overlay);

/* =============================================
   ABRIR / FECHAR
   ============================================= */

function openMenu() {
    nav.classList.add("active");
    overlay.classList.add("active");
    document.body.classList.add("menu-open");
}

function closeMenu() {
    nav.classList.remove("active");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");
}

toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    nav.classList.contains("active") ? closeMenu() : openMenu();
});

if (menuClose) {
    menuClose.addEventListener("click", (e) => {
        e.stopPropagation();
        closeMenu();
    });
}

/* Clique/touch fora do menu fecha */
document.addEventListener("click", (e) => {
    const isMenuOpen = nav.classList.contains("active");
    const clickedMenu = nav.contains(e.target);
    const clickedToggle = toggle.contains(e.target);
    const clickedClose = menuClose && menuClose.contains(e.target);

    if (isMenuOpen && !clickedMenu && !clickedToggle) {
        closeMenu();
    }
});

/* =============================================
   LINKS — fechar ao clicar
   ============================================= */

links.forEach((link) => {
    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");

        closeMenu();

        if (!href.startsWith("#")) return;

        e.preventDefault();

        const target = document.querySelector(href);
        if (!target) return;

        /* Sinaliza que o scroll foi disparado pelo menu */
        menuScrollActive = true;
        clearTimeout(menuScrollTimeout);

        target.scrollIntoView({ behavior: "smooth", block: "start" });

        /* Após o scroll suave terminar, libera a detecção normal.
           scrollIntoView não tem callback — usamos um timeout generoso. */
        menuScrollTimeout = setTimeout(() => {
            menuScrollActive = false;
        }, 1200);
    });
});

/* =============================================
   ESCONDER / MOSTRAR HEADER AO SCROLLAR
   ============================================= */

let lastScrollY = window.scrollY;
let menuScrollActive = false;
let menuScrollTimeout = null;

window.addEventListener(
    "scroll",
    () => {
        const currentY = window.scrollY;
        const goingDown = currentY > lastScrollY;

        /* Scroll disparado pelo clique no menu:
           só esconde o header se for para BAIXO;
           scroll para cima causado pelo menu NÃO reabre o header. */
        if (menuScrollActive) {
            if (goingDown) {
                header.classList.add("header-hidden");
            }
            lastScrollY = currentY;
            return;
        }

        /* Scroll normal do usuário */
        if (goingDown && currentY > 80) {
            header.classList.add("header-hidden");
        } else if (!goingDown) {
            header.classList.remove("header-hidden");
        }

        /* Fechar menu se usuário scrollar para baixo com menu aberto */
        if (goingDown && nav.classList.contains("active")) {
            closeMenu();
        }

        lastScrollY = currentY;
    },
    { passive: true },
);
