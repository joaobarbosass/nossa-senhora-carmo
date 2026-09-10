(function () {
    const TOP_SCROLL_TOLERANCE = 8;
    const VIEWPORT_REVEAL_TOLERANCE = 24;
    const LAYOUT_SETTLE_DELAY = 60;
    const revealCallbacks = [];

    let initialRevealReady = false;
    let initialScrollY = 0;
    let initialViewportBottom = 0;

    function getScrollY() {
        return window.scrollY || document.documentElement.scrollTop || 0;
    }

    function getViewportHeight() {
        return window.innerHeight || document.documentElement.clientHeight || 0;
    }

    function captureInitialViewport() {
        initialScrollY = getScrollY();
        initialViewportBottom = initialScrollY + getViewportHeight();
        initialRevealReady = true;

        revealCallbacks.splice(0).forEach((callback) => {
            callback();
        });
    }

    function waitForStableLayout() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setTimeout(captureInitialViewport, LAYOUT_SETTLE_DELAY);
            });
        });
    }

    window.whenInitialRevealReady = function (callback) {
        if (initialRevealReady) {
            callback();
            return;
        }

        revealCallbacks.push(callback);
    };

    window.shouldRevealEntryImmediately = function (element) {
        if (!element || !initialRevealReady) return false;
        if (initialScrollY <= TOP_SCROLL_TOLERANCE) return false;

        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + getScrollY();
        const revealLimit = initialViewportBottom - VIEWPORT_REVEAL_TOLERANCE;

        return elementTop <= revealLimit;
    };

    window.revealEntryImmediately = function (element, revealCallback) {
        if (!element || typeof revealCallback !== "function") return;

        const animatedElements = [
            element,
            ...element.querySelectorAll(
                [
                    ".impossible-mass__text",
                    ".impossible-mass__details",
                    ".impossible-mass__saint",
                ].join(","),
            ),
        ];
        const previousTransitions = animatedElements.map((animatedElement) => ({
            element: animatedElement,
            transition: animatedElement.style.getPropertyValue("transition"),
            priority: animatedElement.style.getPropertyPriority("transition"),
        }));

        animatedElements.forEach((animatedElement) => {
            animatedElement.style.setProperty("transition", "none", "important");
        });

        revealCallback();
        element.offsetHeight;

        requestAnimationFrame(() => {
            previousTransitions.forEach(({ element, transition, priority }) => {
                if (transition) {
                    element.style.setProperty("transition", transition, priority);
                    return;
                }

                element.style.removeProperty("transition");
            });
        });
    };

    if (document.readyState === "complete") {
        waitForStableLayout();
    } else {
        window.addEventListener("load", waitForStableLayout, { once: true });
    }
})();
