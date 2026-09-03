/* =============================================
   HEADER — menu.js
   ============================================= */

const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".links_header");
const menuClose = document.querySelector(".menu-close");
const header = document.querySelector("header");
const overlay = document.querySelector(".menu-overlay");
const focusableMenuElements = () =>
    Array.from(
        nav?.querySelectorAll(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ) || [],
    ).filter((element) => !element.closest("[hidden]"));
const MENU_LINK_IDLE = "is-idle";
const MENU_LINK_HOVER = "is-hover";
const MENU_LINK_LOADING = "is-loading";
const MENU_LINK_COMPLETED = "is-completed";
const pendingLinkActions = new WeakMap();

/* ── TOQUE: DIFERENCIAÇÃO SCROLL/CLIQUE (estado global do menu) ── */
const TOUCH_MOVE_THRESHOLD = 15; // px

let touchStartX = 0;
let touchStartY = 0;
let isTouchScrolling = false;
let touchedLink = null;
let lastInteractionWasTouch = false;
let lastFocusedElement = null;
let lockedScrollY = 0;

function isMenuEventTarget(target) {
    return Boolean(nav?.contains(target));
}

function preventBackgroundScroll(e) {
    if (!document.body.classList.contains("menu-open")) return;
    if (isMenuEventTarget(e.target)) return;

    e.preventDefault();
}

function lockBackgroundScroll() {
    lockedScrollY = window.scrollY;
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

    document.body.style.setProperty("--locked-scroll-y", `${lockedScrollY}px`);
    document.body.style.setProperty(
        "--page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.body.classList.add("menu-open");

    window.addEventListener("wheel", preventBackgroundScroll, {
        passive: false,
    });
    window.addEventListener("touchmove", preventBackgroundScroll, {
        passive: false,
    });
}

function unlockBackgroundScroll() {
    document.body.classList.remove("menu-open");
    document.body.style.removeProperty("--locked-scroll-y");
    document.body.style.removeProperty("--page-scrollbar-width");

    window.removeEventListener("wheel", preventBackgroundScroll);
    window.removeEventListener("touchmove", preventBackgroundScroll);

    window.scrollTo(0, lockedScrollY);
}

/* =============================================
   ABRIR / FECHAR
   ============================================= */

function openMenu() {
    if (!nav) return;

    lastFocusedElement = document.activeElement;

    // reativa transições
    nav.classList.remove("no-transition");

    nav.classList.add("active");
    overlay?.classList.add("active");
    lockBackgroundScroll();
    toggle?.setAttribute("aria-expanded", "true");
    nav?.setAttribute("aria-hidden", "false");
    overlay?.setAttribute("aria-hidden", "false");

    links?.forEach((link) => setLinkState(link, MENU_LINK_IDLE));

    requestAnimationFrame(() => {
        menuClose?.focus();
    });
}

function isInternalHref(href) {
    return typeof href === "string" && href.startsWith("#");
}

function setLinkState(link, state) {
    link.classList.remove(
        MENU_LINK_IDLE,
        MENU_LINK_HOVER,
        MENU_LINK_LOADING,
        MENU_LINK_COMPLETED,
    );
    link.classList.add(state);
}

function startLinkLoading(link) {
    if (link.classList.contains(MENU_LINK_LOADING)) return;

    setLinkState(link, MENU_LINK_LOADING);
}

function ensureMenuLinkText(link) {
    if (link.querySelector(".menu-link-text")) return;

    const text = link.textContent?.trim();

    if (!text) return;

    link.textContent = "";

    const span = document.createElement("span");
    span.className = "menu-link-text";
    span.textContent = text;

    link.appendChild(span);
}

function navigateByHref(link, href) {
    link.classList.remove(MENU_LINK_LOADING);
    link.classList.add(MENU_LINK_COMPLETED);

    pendingLinkActions.delete(link);

    if (isInternalHref(href)) {
        finishInternalNavigation(link, href);
        return;
    }

    finishExternalNavigation(link, href);
}

function armLinkNavigation(link, href) {
    if (!href) return;

    pendingLinkActions.set(link, href);

    if (link.classList.contains(MENU_LINK_HOVER)) {
        navigateByHref(link, href);
        return;
    }

    startLinkLoading(link);
}

function finishExternalNavigation(link, href) {
    link.classList.remove(MENU_LINK_LOADING);
    link.classList.add(MENU_LINK_COMPLETED);

    window.location.href = href;
}

function finishInternalNavigation(link, href) {
    const target = document.querySelector(href);

    link.classList.remove(MENU_LINK_LOADING);
    link.classList.add(MENU_LINK_COMPLETED);

    closeMenu({ keepHeaderVisible: false });

    if (!target) return;

    menuScrollActive = true;
    clearTimeout(menuScrollTimeout);

    requestAnimationFrame(() => {
        if (href === "#inicio") {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } else {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }

        menuScrollTimeout = setTimeout(() => {
            menuScrollActive = false;
        }, 1200);
    });
}

function closeMenu({ keepHeaderVisible = true } = {}) {
    if (!nav) return;

    // remove delays/transições ao fechar
    nav.classList.add("no-transition");

    // reseta scroll do menu para o topo (sem animação)
    const menuList = nav?.querySelector("ul");
    if (menuList) {
        menuList.scrollTop = 0;
    }

    nav.classList.remove("active");

    overlay?.classList.remove("active");

    unlockBackgroundScroll();

    if (keepHeaderVisible) {
        header?.classList.remove("header-hidden");
        lastScrollY = lockedScrollY;
    }

    toggle?.setAttribute("aria-expanded", "false");
    nav?.setAttribute("aria-hidden", "true");
    overlay?.setAttribute("aria-hidden", "true");

    // força repaint
    void nav.offsetWidth;

    // restaura transições para próxima abertura
    requestAnimationFrame(() => {
        nav.classList.remove("no-transition");
    });

    if (lastFocusedElement && document.contains(lastFocusedElement)) {
        lastFocusedElement.focus();
    }
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
    if (e.key === "Escape" && nav?.classList.contains("active")) {
        closeMenu();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    if (!nav?.classList.contains("active")) return;

    const focusableElements = focusableMenuElements();

    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
        return;
    }

    if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
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
    ensureMenuLinkText(link);

    setLinkState(link, MENU_LINK_IDLE);

    link.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse") return;

        if (link.classList.contains(MENU_LINK_LOADING)) return;

        setLinkState(link, MENU_LINK_HOVER);
    });

    link.addEventListener("pointerleave", (e) => {
        if (e.pointerType !== "mouse") return;

        if (link.classList.contains(MENU_LINK_LOADING)) return;

        setLinkState(link, MENU_LINK_IDLE);
    });

    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");

        if (!href) return;

        /* ── IGNORAR CLIQUE SINTÉTICO DO TOUCH ── */
        if (lastInteractionWasTouch) {
            e.preventDefault();
            e.stopPropagation();
            lastInteractionWasTouch = false;
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        armLinkNavigation(link, href);
    });

    link.addEventListener("transitionend", (e) => {
        if (e.pseudoElement !== "::after") return;
        if (e.propertyName !== "transform") return;
        if (!link.classList.contains(MENU_LINK_LOADING)) return;

        const href = pendingLinkActions.get(link);

        if (!href) return;

        navigateByHref(link, href);
    });
});

/* =============================================
   SWIPE PARA FECHAR / TOQUE: SCROLL vs CLIQUE
   ============================================= */

const SWIPE_THRESHOLD = 60;
const SWIPE_MAX_VERTICAL = 50;

nav?.addEventListener(
    "touchstart",
    (e) => {
        clearTimeout(window.__touchResetTimeout);
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouchScrolling = false;
        touchedLink = e.target.closest("a");
    },
    { passive: true },
);

nav?.addEventListener(
    "touchmove",
    (e) => {
        if (isTouchScrolling) return;

        const dx = Math.abs(e.touches[0].clientX - touchStartX);
        const dy = Math.abs(e.touches[0].clientY - touchStartY);

        if (
            !isTouchScrolling &&
            (dx >= TOUCH_MOVE_THRESHOLD || dy >= TOUCH_MOVE_THRESHOLD)
        ) {
            isTouchScrolling = true;
            touchedLink = null;
        }
    },
    { passive: true },
);

nav?.addEventListener(
    "touchend",
    (e) => {
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);

        // Arrastou para a direita
        if (deltaX > SWIPE_THRESHOLD && deltaY < SWIPE_MAX_VERTICAL) {
            closeMenu();
        }

        // Se não foi scroll e existe link tocado, inicia animação
        if (!isTouchScrolling && touchedLink) {
            const href = touchedLink.getAttribute("href");
            if (href) {
                armLinkNavigation(touchedLink, href);
                lastInteractionWasTouch = true;
            }
        }

        // Limpa o link tocado
        touchedLink = null;

        // Reseta scroll flag com atraso para evitar issues com navegadores
        window.__touchResetTimeout = setTimeout(() => {
            isTouchScrolling = false;
        }, 120);
    },
    { passive: true },
);

/* =============================================
   HEADER SCROLL
   ============================================= */

let lastScrollY = window.scrollY;
let menuScrollActive = false;
let menuScrollTimeout = null;
let scrollTicking = false;
const heroSection = document.querySelector("[data-hero-carousel]");

const SCROLL_TOLERANCE = 5;

function getHeaderHeight() {
    const headerHeight = getComputedStyle(document.documentElement)
        .getPropertyValue("--header-height")
        .trim();

    return Number.parseFloat(headerHeight) || 0;
}

function isHeroStillInView() {
    if (!heroSection) return false;

    return heroSection.getBoundingClientRect().bottom > getHeaderHeight();
}

function isHeaderVisibilitySuspended() {
    return (
        window.__suspendHeaderVisibility ||
        document.body.classList.contains("community-modal-open")
    );
}

function updateHeaderVisibility() {
    const currentY = window.scrollY;
    const delta = currentY - lastScrollY;

    if (isHeaderVisibilitySuspended()) {
        lastScrollY = currentY;
        scrollTicking = false;

        return;
    }

    if (isHeroStillInView()) {
        header?.classList.remove("header-hidden");
        lastScrollY = currentY;
        scrollTicking = false;

        return;
    }

    if (Math.abs(delta) < SCROLL_TOLERANCE) {
        scrollTicking = false;
        return;
    }

    const goingDown = delta > 0;

    if (menuScrollActive) {
        if (goingDown) {
            header?.classList.add("header-hidden");
        }

        lastScrollY = currentY;
        scrollTicking = false;

        return;
    }

    if (goingDown && currentY > 30) {
        header?.classList.add("header-hidden");
    }

    if (!goingDown || currentY <= 0) {
        header?.classList.remove("header-hidden");
    }

    if (goingDown && nav?.classList.contains("active")) {
        closeMenu();
    }

    lastScrollY = currentY;
    scrollTicking = false;
}

window.addEventListener(
    "scroll",
    () => {
        if (scrollTicking) return;

        scrollTicking = true;
        requestAnimationFrame(updateHeaderVisibility);
    },
    { passive: true },
);

window.addEventListener(
    "resize",
    () => {
        lastScrollY = window.scrollY;
        updateHeaderVisibility();
    },
    { passive: true },
);
