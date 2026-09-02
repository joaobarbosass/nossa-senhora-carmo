const tapFeedbackSelector = [
    ".hero-carousel__cta",
    ".hero-carousel__button",
    ".comunidade-card",
    ".live-section__link",
    ".community-modal__close",
    ".community-gallery__button",
    ".community-modal__link",
    ".menu-close",
].join(",");

const tapFeedbackTimers = new WeakMap();
const TAP_FEEDBACK_DURATION = 180;

function clearTapFeedback(element) {
    const timer = tapFeedbackTimers.get(element);

    if (timer) {
        clearTimeout(timer);
        tapFeedbackTimers.delete(element);
    }

    element.classList.remove("is-tap-feedback");
}

function showTapFeedback(element) {
    clearTapFeedback(element);
    element.classList.add("is-tap-feedback");

    const timer = setTimeout(() => {
        clearTapFeedback(element);
    }, TAP_FEEDBACK_DURATION);

    tapFeedbackTimers.set(element, timer);
}

document.addEventListener(
    "pointerdown",
    (event) => {
        if (event.pointerType === "mouse") return;

        const target = event.target.closest(tapFeedbackSelector);

        if (!target) return;

        showTapFeedback(target);
    },
    { passive: true },
);

document.addEventListener(
    "pointercancel",
    (event) => {
        const target = event.target.closest(tapFeedbackSelector);

        if (!target) return;

        clearTapFeedback(target);
    },
    { passive: true },
);
