const heroCarousel = document.querySelector("[data-hero-carousel]");

const churchSlides = (window.igrejasComunidades || []).map((igreja) => ({
    id: igreja.id,
    name: igreja.nome,
    image: igreja.imagemPrincipal,
    alt: igreja.imagemAlt,
    objectPosition: igreja.objectPosition,
}));

if (heroCarousel && churchSlides.length) {
    const media = heroCarousel.querySelector("[data-carousel-media]");
    const title = heroCarousel.querySelector("[data-carousel-title]");
    const communityCta = heroCarousel.querySelector(
        "[data-carousel-community-cta]",
    );
    const dotsContainer = heroCarousel.querySelector("[data-carousel-dots]");
    const prevButton = heroCarousel.querySelector("[data-carousel-prev]");
    const nextButton = heroCarousel.querySelector("[data-carousel-next]");
    const AUTOPLAY_DELAY = 5200;
    const INTERACTION_PAUSE = 6500;
    const SWIPE_THRESHOLD = 45;
    const TRACKPAD_SWIPE_THRESHOLD = 52;
    const TRACKPAD_SWIPE_COOLDOWN = 650;

    let currentIndex = 0;
    let autoplayTimer = null;
    let resumeTimer = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let isPointerDown = false;
    let communityNavigationActive = false;
    let communityNavigationFrame = null;
    let isHeroInView = true;
    let isPageVisible = !document.hidden;
    let lastTrackpadSwipeTime = 0;

    function markHeroCarouselReady() {
        if (heroCarousel.dataset.heroReady === "true") return;

        heroCarousel.dataset.heroReady = "true";
        window.dispatchEvent(new CustomEvent("hero-carousel-ready"));
    }

    function waitForHeroImage(image) {
        if (!image || image.hidden) {
            markHeroCarouselReady();
            return;
        }

        if (image.complete && image.naturalWidth > 0) {
            if (typeof image.decode === "function") {
                image.decode().catch(() => {}).finally(markHeroCarouselReady);
            } else {
                markHeroCarouselReady();
            }

            return;
        }

        image.addEventListener("load", markHeroCarouselReady, { once: true });
        image.addEventListener("error", markHeroCarouselReady, { once: true });
    }

    const slideElements = churchSlides.map((slide, index) => {
        const image = document.createElement("img");

        image.className = "hero-carousel__image";
        image.alt = slide.alt;
        image.dataset.churchId = slide.id;
        image.style.objectPosition = slide.objectPosition;
        image.setAttribute("aria-hidden", index === 0 ? "false" : "true");

        if (slide.image) {
            image.src = slide.image;
        } else {
            image.hidden = true;
            heroCarousel.classList.add("hero-carousel--fallback");
        }

        if (index === 0) {
            image.classList.add("active");
        }

        image.addEventListener(
            "error",
            () => {
                image.hidden = true;
                heroCarousel.classList.add("hero-carousel--fallback");
            },
            { once: true },
        );

        media.appendChild(image);

        return image;
    });

    waitForHeroImage(slideElements[0]);

    const dotElements = churchSlides.map((slide, index) => {
        const dot = document.createElement("button");

        dot.className = "hero-carousel__dot";
        dot.type = "button";
        dot.dataset.churchId = slide.id;
        dot.setAttribute("aria-label", slide.name);
        dot.setAttribute("aria-current", index === 0 ? "true" : "false");

        dot.addEventListener("click", () => {
            pauseAfterInteraction();
            goToSlide(index);
        });

        dotsContainer.appendChild(dot);

        return dot;
    });

    function goToSlide(nextIndex) {
        const normalizedIndex =
            (nextIndex + churchSlides.length) % churchSlides.length;

        if (normalizedIndex === currentIndex) return;

        slideElements[currentIndex].classList.remove("active");
        slideElements[currentIndex].setAttribute("aria-hidden", "true");
        dotElements[currentIndex].setAttribute("aria-current", "false");

        currentIndex = normalizedIndex;

        const currentSlide = churchSlides[currentIndex];

        slideElements[currentIndex].classList.add("active");
        slideElements[currentIndex].setAttribute("aria-hidden", "false");
        dotElements[currentIndex].setAttribute("aria-current", "true");

        heroCarousel.dataset.activeChurch = currentSlide.id;

        if (communityCta) {
            communityCta.dataset.communityId = currentSlide.id;
        }

        title.textContent = currentSlide.name;
        title.classList.remove("is-changing");

        requestAnimationFrame(() => {
            title.classList.add("is-changing");
        });
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function previousSlide() {
        goToSlide(currentIndex - 1);
    }

    function canAutoplay() {
        return isHeroInView && isPageVisible && !communityNavigationActive;
    }

    function startAutoplay() {
        clearInterval(autoplayTimer);
        clearTimeout(resumeTimer);

        if (!canAutoplay()) return;

        autoplayTimer = setInterval(nextSlide, AUTOPLAY_DELAY);
    }

    function pauseAutoplay() {
        clearInterval(autoplayTimer);
        clearTimeout(resumeTimer);
    }

    function pauseAfterInteraction() {
        pauseAutoplay();

        if (!canAutoplay()) return;

        resumeTimer = setTimeout(startAutoplay, INTERACTION_PAUSE);
    }

    function getHeaderHeight() {
        const headerHeight = getComputedStyle(document.documentElement)
            .getPropertyValue("--header-height")
            .trim();

        return Number.parseFloat(headerHeight) || 0;
    }

    function getSafeCommunitySelector(id) {
        if (window.CSS?.escape) {
            return `.comunidade-card[data-community-id="${CSS.escape(id)}"]`;
        }

        return `.comunidade-card[data-community-id="${id}"]`;
    }

    function getCommunityCard(id) {
        return document.querySelector(getSafeCommunitySelector(id));
    }

    function getScrollTargetTop(element) {
        const scrollMarginTop =
            Number.parseFloat(getComputedStyle(element).scrollMarginTop) ||
            getHeaderHeight();
        const targetY = Math.max(
            element.getBoundingClientRect().top +
                window.scrollY -
                scrollMarginTop,
            0,
        );
        const maxScrollY = Math.max(
            document.documentElement.scrollHeight - window.innerHeight,
            0,
        );

        return Math.min(targetY, maxScrollY);
    }

    function waitForScrollArrival(targetY) {
        return new Promise((resolve) => {
            const tolerance = 2;
            const requiredStableFrames = 4;
            const maxFrames = 240;
            let frameCount = 0;
            let stableFrames = 0;
            let lastY = window.scrollY;

            const checkScroll = () => {
                const currentY = window.scrollY;
                const distance = Math.abs(currentY - targetY);
                const movement = Math.abs(currentY - lastY);

                if (distance <= tolerance && movement <= 0.5) {
                    stableFrames += 1;
                } else {
                    stableFrames = 0;
                }

                if (stableFrames >= requiredStableFrames) {
                    communityNavigationFrame = null;
                    resolve(true);
                    return;
                }

                frameCount += 1;
                lastY = currentY;

                if (frameCount >= maxFrames) {
                    communityNavigationFrame = null;
                    resolve(false);
                    return;
                }

                communityNavigationFrame = requestAnimationFrame(checkScroll);
            };

            communityNavigationFrame = requestAnimationFrame(checkScroll);
        });
    }

    async function navigateToCurrentCommunity() {
        if (communityNavigationActive) return;

        const selectedCommunityId = communityCta?.dataset.communityId;
        const communityCard = getCommunityCard(selectedCommunityId);

        if (!selectedCommunityId || !communityCard) return;

        communityNavigationActive = true;
        pauseAutoplay();

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const targetY = getScrollTargetTop(communityCard);

        window.scrollTo({
            top: targetY,
            behavior: reducedMotion ? "auto" : "smooth",
        });

        const arrived = await waitForScrollArrival(targetY);

        communityNavigationActive = false;
        pauseAfterInteraction();

        if (!arrived) return;

        communityCard.focus({ preventScroll: true });
        window.abrirModalIgreja?.(selectedCommunityId);
    }

    prevButton.addEventListener("click", () => {
        pauseAfterInteraction();
        previousSlide();
    });

    nextButton.addEventListener("click", () => {
        pauseAfterInteraction();
        nextSlide();
    });

    communityCta?.addEventListener("click", navigateToCurrentCommunity);

    heroCarousel.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") return;

        isPointerDown = true;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        pauseAfterInteraction();
    });

    heroCarousel.addEventListener("focusin", pauseAutoplay);
    heroCarousel.addEventListener("focusout", pauseAfterInteraction);

    document.addEventListener("visibilitychange", () => {
        isPageVisible = !document.hidden;
        isPageVisible ? pauseAfterInteraction() : pauseAutoplay();
    });

    if ("IntersectionObserver" in window) {
        const heroVisibilityObserver = new IntersectionObserver(
            ([entry]) => {
                isHeroInView = entry.isIntersecting;
                isHeroInView ? pauseAfterInteraction() : pauseAutoplay();
            },
            { threshold: 0.15 },
        );

        heroVisibilityObserver.observe(heroCarousel);
    }

    heroCarousel.addEventListener(
        "wheel",
        (event) => {
            const horizontalMovement = Math.abs(event.deltaX);
            const verticalMovement = Math.abs(event.deltaY);

            if (horizontalMovement < TRACKPAD_SWIPE_THRESHOLD) return;
            if (verticalMovement > horizontalMovement) return;

            const now = Date.now();

            if (now - lastTrackpadSwipeTime < TRACKPAD_SWIPE_COOLDOWN) return;

            event.preventDefault();
            lastTrackpadSwipeTime = now;
            pauseAfterInteraction();

            event.deltaX > 0 ? nextSlide() : previousSlide();
        },
        { passive: false },
    );

    heroCarousel.addEventListener("pointerup", (event) => {
        if (!isPointerDown) return;

        const deltaX = event.clientX - pointerStartX;
        const deltaY = event.clientY - pointerStartY;

        isPointerDown = false;

        if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
        if (Math.abs(deltaY) > Math.abs(deltaX)) return;

        deltaX < 0 ? nextSlide() : previousSlide();
    });

    heroCarousel.addEventListener("pointercancel", () => {
        isPointerDown = false;
    });

    heroCarousel.dataset.activeChurch = churchSlides[0].id;
    if (communityCta) {
        communityCta.dataset.communityId = churchSlides[0].id;
    }
    startAutoplay();
}
