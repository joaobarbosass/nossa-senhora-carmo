const stainedGlassGrid = document.querySelector("[data-stained-glass-grid]");
const parishVideosGrid = document.querySelector("[data-videos-grid]");
const videoModal = document.querySelector("[data-video-modal]");
const videoModalDialog = document.querySelector(".video-modal__dialog");
const videoModalOverlay = document.querySelector("[data-video-modal-overlay]");
const videoModalClose = document.querySelector("[data-video-modal-close]");
const videoModalPlayer = document.querySelector("[data-video-modal-player]");
const videoModalTitle = document.querySelector("[data-video-modal-title]");
const videoModalYoutube = document.querySelector("[data-video-modal-youtube]");

const vitraisParoquia = window.vitraisParoquia || [];
const videosParoquia = window.videosParoquia || [];
const VIDEOS_HOME_LIMIT = 6;
const VIDEO_MODAL_CLOSE_TRANSITION_DELAY = 240;

let videoModalLastFocusedElement = null;
let videoModalLockedScrollY = 0;

function getYoutubeThumbnail(youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

function getYoutubeWatchUrl(youtubeId) {
    return `https://www.youtube.com/watch?v=${youtubeId}`;
}

function getYoutubeEmbedUrl(youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`;
}

function createVideoImage(video) {
    const image = document.createElement("img");

    image.src = video.thumbnail || getYoutubeThumbnail(video.youtubeId);
    image.alt = video.thumbnailAlt || `Thumbnail de ${video.titulo}`;
    image.loading = "lazy";

    return image;
}

function createStainedGlassCard(vitral) {
    const card = document.createElement("a");
    const imageWrapper = document.createElement("span");
    const content = document.createElement("span");
    const title = document.createElement("strong");
    const cta = document.createElement("span");

    card.className = "stained-glass-card";
    card.href = vitral.pagina;
    card.setAttribute("aria-label", `Conhecer vitral ${vitral.titulo}`);

    imageWrapper.className = "stained-glass-card__image";
    imageWrapper.appendChild(createVideoImage(vitral));

    content.className = "stained-glass-card__content";
    title.textContent = vitral.titulo;
    cta.textContent = "Conhecer vitral";

    content.append(title, cta);
    card.append(imageWrapper, content);

    return card;
}

function createParishVideoCard(video) {
    const card = document.createElement("article");
    const imageWrapper = document.createElement("div");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const button = document.createElement("button");

    card.className = "parish-video-card";
    imageWrapper.className = "parish-video-card__image";
    content.className = "parish-video-card__content";
    button.className = "live-section__link parish-video-card__button";
    button.type = "button";
    button.textContent = "Assistir vídeo";
    button.setAttribute("aria-label", `Assistir vídeo ${video.titulo}`);

    imageWrapper.appendChild(createVideoImage(video));
    title.textContent = video.titulo;
    content.append(title, button);
    card.append(imageWrapper, content);

    button.addEventListener("click", () => {
        openVideoModal(video);
    });

    card.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;

        openVideoModal(video);
    });

    return card;
}

function renderStainedGlassCards() {
    if (!stainedGlassGrid) return;

    const fragment = document.createDocumentFragment();

    vitraisParoquia.forEach((vitral) => {
        fragment.appendChild(createStainedGlassCard(vitral));
    });

    stainedGlassGrid.replaceChildren(fragment);
}

function renderParishVideoCards() {
    if (!parishVideosGrid) return;

    if (!videosParoquia.length) {
        const empty = document.createElement("p");

        empty.className = "parish-videos__empty";
        empty.textContent = "Novos vídeos serão adicionados em breve.";
        parishVideosGrid.replaceChildren(empty);
        return;
    }

    const fragment = document.createDocumentFragment();

    videosParoquia.slice(0, VIDEOS_HOME_LIMIT).forEach((video) => {
        fragment.appendChild(createParishVideoCard(video));
    });

    parishVideosGrid.replaceChildren(fragment);
}

function createVideoIframe(video) {
    const iframe = document.createElement("iframe");

    iframe.src = getYoutubeEmbedUrl(video.youtubeId);
    iframe.title = `Vídeo: ${video.titulo}`;
    iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    return iframe;
}

function lockVideoModalScroll() {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

    videoModalLockedScrollY = window.scrollY;
    window.__suspendHeaderVisibility = true;

    document.body.style.setProperty(
        "--video-modal-locked-scroll-y",
        `${videoModalLockedScrollY}px`,
    );
    document.body.style.setProperty(
        "--video-modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.body.classList.add("video-modal-open");
}

function unlockVideoModalScroll() {
    const scrollY = videoModalLockedScrollY;

    document.body.classList.remove("video-modal-open");
    document.body.style.removeProperty("--video-modal-locked-scroll-y");
    document.body.style.removeProperty("--video-modal-page-scrollbar-width");

    window.scrollTo(0, scrollY);

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);

        requestAnimationFrame(() => {
            window.__suspendHeaderVisibility = false;
        });
    });
}

function openVideoModal(video) {
    if (!videoModal || !videoModalOverlay || !videoModalPlayer) return;

    videoModalLastFocusedElement = document.activeElement;
    videoModalTitle.textContent = video.titulo;
    videoModalYoutube.href = getYoutubeWatchUrl(video.youtubeId);
    videoModalPlayer.replaceChildren(createVideoIframe(video));
    lockVideoModalScroll();

    videoModal.hidden = false;
    videoModalOverlay.hidden = false;
    videoModal.setAttribute("aria-hidden", "false");
    videoModalOverlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        videoModal.classList.add("active");
        videoModalOverlay.classList.add("active");
        videoModal.focus();
    });
}

function closeVideoModal() {
    if (!videoModal?.classList.contains("active")) return;

    videoModalPlayer.replaceChildren();
    videoModal.classList.remove("active");
    videoModalOverlay?.classList.remove("active");
    videoModal.setAttribute("aria-hidden", "true");
    videoModalOverlay?.setAttribute("aria-hidden", "true");

    setTimeout(() => {
        videoModal.hidden = true;

        if (videoModalOverlay) {
            videoModalOverlay.hidden = true;
        }

        unlockVideoModalScroll();

        if (
            videoModalLastFocusedElement &&
            document.contains(videoModalLastFocusedElement)
        ) {
            videoModalLastFocusedElement.focus({ preventScroll: true });
        }
    }, VIDEO_MODAL_CLOSE_TRANSITION_DELAY);
}

function getVideoModalFocusableElements() {
    return Array.from(
        videoModal.querySelectorAll(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
    ).filter((element) => !element.hidden);
}

videoModalClose?.addEventListener("click", closeVideoModal);
videoModalOverlay?.addEventListener("click", closeVideoModal);

videoModal?.addEventListener("click", (event) => {
    if (videoModalDialog?.contains(event.target)) return;

    closeVideoModal();
});

document.addEventListener("keydown", (event) => {
    if (!videoModal?.classList.contains("active")) return;

    if (event.key === "Escape") {
        closeVideoModal();
        return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getVideoModalFocusableElements();

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

renderStainedGlassCards();
renderParishVideoCards();
