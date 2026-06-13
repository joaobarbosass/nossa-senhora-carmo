/* =============================================
   HEADER — menu.js
   ============================================= */

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".links_header");
const menuClose = document.querySelector(".menu-close");
const header = document.querySelector("header");
const overlay = document.querySelector(".menu-overlay");

/* =============================================
   ABRIR / FECHAR
   ============================================= */

function openMenu() {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`,
    );

    // reativa transições
    nav.classList.remove("no-transition");

    nav.classList.add("active");
    overlay?.classList.add("active");
    document.body.classList.add("menu-open");
}

function closeMenu() {
    // remove delays/transições ao fechar
    nav.classList.add("no-transition");

    nav.classList.remove("active");

    overlay?.classList.remove("active");

    document.body.classList.remove("menu-open");

    // força repaint
    void nav.offsetWidth;

    // restaura transições para próxima abertura
    requestAnimationFrame(() => {
        nav.classList.remove("no-transition");
    });
}

toggle?.addEventListener("click", (e) => {
    e.stopPropagation();

    nav.classList.contains("active") ? closeMenu() : openMenu();
});

menuClose?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeMenu();
});

/* =============================================
   OVERLAY
   ============================================= */

overlay?.addEventListener("click", closeMenu);

/* =============================================
   ESC FECHA MENU
   ============================================= */

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("active")) {
        closeMenu();
    }
});

/* =============================================
   LINKS
   ============================================= */

const links = Array.from(document.querySelectorAll(".links_header a")).filter(
    (a) => {
        const li = a.closest("li");

        return window.getComputedStyle(li).display !== "none";
    },
);

links.forEach((link) => {
    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");

        if (!href || !href.startsWith("#")) {
            closeMenu();
            return;
        }

        e.preventDefault();

        closeMenu();

        const target = document.querySelector(href);

        if (!target) return;

        menuScrollActive = true;

        clearTimeout(menuScrollTimeout);

        target.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        menuScrollTimeout = setTimeout(() => {
            menuScrollActive = false;
        }, 1200);
    });
});

/* =============================================
   SWIPE PARA FECHAR
   ============================================= */

let touchStartX = 0;
let touchStartY = 0;

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_VERTICAL = 80;

nav?.addEventListener(
    "touchstart",
    (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    },
    { passive: true },
);

nav?.addEventListener(
    "touchend",
    (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;

        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);

        if (deltaX > SWIPE_THRESHOLD && deltaY < SWIPE_MAX_VERTICAL) {
            closeMenu();
        }
    },
    { passive: true },
);

/* =============================================
   HEADER SCROLL
   ============================================= */

let lastScrollY = window.scrollY;
let menuScrollActive = false;
let menuScrollTimeout = null;

window.addEventListener(
    "scroll",
    () => {
        const currentY = window.scrollY;
        const goingDown = currentY > lastScrollY;

        if (menuScrollActive) {
            if (goingDown) {
                header?.classList.add("header-hidden");
            }

            lastScrollY = currentY;
            return;
        }

        if (goingDown && currentY > 80) {
            header?.classList.add("header-hidden");
        } else if (!goingDown) {
            header?.classList.remove("header-hidden");
        }

        if (goingDown && nav?.classList.contains("active")) {
            closeMenu();
        }

        lastScrollY = currentY;
    },
    { passive: true },
);
