const priestSection = document.querySelector("[data-parish-priest]");
const priestDays = document.querySelector("[data-priest-days]");
const priestModalOpen = document.querySelector("[data-priest-modal-open]");
const priestModal = document.querySelector("[data-priest-modal]");
const priestModalDialog = document.querySelector(".priest-modal__dialog");
const priestModalOverlay = document.querySelector("[data-priest-modal-overlay]");
const priestModalClose = document.querySelector("[data-priest-modal-close]");

const PRIEST_MISSION_START_DATE = {
    year: 2021,
    month: 12,
    day: 8,
};
const PRIEST_COUNTER_DURATION = 1100;
const PRIEST_MODAL_CLOSE_TRANSITION_DELAY = 240;

let priestCounterAnimated = false;
let priestModalLastFocusedElement = null;
let priestModalLockedScrollY = 0;

function getCivilDateValue(date) {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

function getPriestMissionDays(referenceDate = new Date()) {
    const startDate = Date.UTC(
        PRIEST_MISSION_START_DATE.year,
        PRIEST_MISSION_START_DATE.month - 1,
        PRIEST_MISSION_START_DATE.day,
    );
    const currentDate = getCivilDateValue(referenceDate);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    return Math.max(
        Math.floor((currentDate - startDate) / millisecondsPerDay),
        0,
    );
}

function formatMissionDays(value) {
    return new Intl.NumberFormat("pt-BR").format(value);
}

function setMissionDays(value) {
    if (!priestDays) return;

    priestDays.textContent = formatMissionDays(value);
}

function animateMissionDays(finalValue) {
    if (!priestDays) return;

    const shouldReduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (shouldReduceMotion) {
        setMissionDays(finalValue);
        return;
    }

    const startTime = performance.now();

    function updateCounter(currentTime) {
        const progress = Math.min(
            (currentTime - startTime) / PRIEST_COUNTER_DURATION,
            1,
        );
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(finalValue * easedProgress);

        setMissionDays(currentValue);

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
            return;
        }

        setMissionDays(finalValue);
    }

    requestAnimationFrame(updateCounter);
}

function revealPriestCounter() {
    if (priestCounterAnimated) return;

    priestCounterAnimated = true;
    animateMissionDays(getPriestMissionDays());
}

function setupPriestCounter() {
    if (!priestSection || !priestDays) return;

    const finalValue = getPriestMissionDays();
    const shouldReduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (shouldReduceMotion || !("IntersectionObserver" in window)) {
        priestCounterAnimated = true;
        setMissionDays(finalValue);
        return;
    }

    setMissionDays(0);

    const observer = new IntersectionObserver(
        ([entry], currentObserver) => {
            if (!entry.isIntersecting) return;

            revealPriestCounter();
            currentObserver.disconnect();
        },
        { threshold: 0.35 },
    );

    observer.observe(priestDays);
}

function lockPriestModalScroll() {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

    priestModalLockedScrollY = window.scrollY;
    window.__suspendHeaderVisibility = true;

    document.body.style.setProperty(
        "--priest-modal-locked-scroll-y",
        `${priestModalLockedScrollY}px`,
    );
    document.body.style.setProperty(
        "--priest-modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.body.style.setProperty(
        "--active-modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.documentElement.classList.add("modal-scroll-locked");
    document.body.classList.add("priest-modal-open");
}

function unlockPriestModalScroll() {
    const scrollY = priestModalLockedScrollY;

    document.body.classList.remove("priest-modal-open");
    document.documentElement.classList.remove("modal-scroll-locked");
    document.body.style.removeProperty("--priest-modal-locked-scroll-y");
    document.body.style.removeProperty("--priest-modal-page-scrollbar-width");
    document.body.style.removeProperty("--active-modal-page-scrollbar-width");

    window.scrollTo(0, scrollY);

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);

        requestAnimationFrame(() => {
            window.__suspendHeaderVisibility = false;
        });
    });
}

function openPriestModal() {
    if (!priestModal || !priestModalOverlay) return;

    priestModalLastFocusedElement = document.activeElement;
    lockPriestModalScroll();

    priestModal.hidden = false;
    priestModalOverlay.hidden = false;
    priestModal.setAttribute("aria-hidden", "false");
    priestModalOverlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        priestModal.classList.add("active");
        priestModalOverlay.classList.add("active");
        priestModal.focus();
    });
}

function closePriestModal() {
    if (!priestModal?.classList.contains("active")) return;

    priestModal.classList.remove("active");
    priestModalOverlay?.classList.remove("active");
    priestModal.setAttribute("aria-hidden", "true");
    priestModalOverlay?.setAttribute("aria-hidden", "true");
    unlockPriestModalScroll();

    setTimeout(() => {
        priestModal.hidden = true;

        if (priestModalOverlay) {
            priestModalOverlay.hidden = true;
        }

        if (
            priestModalLastFocusedElement &&
            document.contains(priestModalLastFocusedElement)
        ) {
            priestModalLastFocusedElement.focus({ preventScroll: true });
        }
    }, PRIEST_MODAL_CLOSE_TRANSITION_DELAY);
}

function getPriestModalFocusableElements() {
    return Array.from(
        priestModal.querySelectorAll(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
    ).filter((element) => !element.hidden);
}

priestModalOpen?.addEventListener("click", openPriestModal);
priestModalClose?.addEventListener("click", closePriestModal);
priestModalOverlay?.addEventListener("click", closePriestModal);

priestModal?.addEventListener("click", (event) => {
    if (priestModalDialog?.contains(event.target)) return;

    closePriestModal();
});

document.addEventListener("keydown", (event) => {
    if (!priestModal?.classList.contains("active")) return;

    if (event.key === "Escape") {
        closePriestModal();
        return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getPriestModalFocusableElements();

    if (!focusableElements.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
});

setupPriestCounter();
