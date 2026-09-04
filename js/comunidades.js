const comunidadesGrid = document.querySelector("[data-comunidades-grid]");
const communityModal = document.querySelector("[data-community-modal]");
const communityModalDialog = document.querySelector(".community-modal__dialog");
const communityModalOverlay = document.querySelector(
    "[data-community-modal-overlay]",
);
const communityModalClose = document.querySelector(
    "[data-community-modal-close]",
);
const communityGallery = document.querySelector("[data-community-gallery]");
const communityGalleryDots = document.querySelector(
    "[data-community-gallery-dots]",
);
const communityGalleryPrev = document.querySelector(
    "[data-community-gallery-prev]",
);
const communityGalleryNext = document.querySelector(
    "[data-community-gallery-next]",
);
const communityTitle = document.querySelector("[data-community-title]");
const communitySubtitle = document.querySelector("[data-community-subtitle]");
const communityMassTimes = document.querySelector(
    "[data-community-mass-times]",
);
const communityConfessionTimes = document.querySelector(
    "[data-community-confession-times]",
);
const communityConfessionGroup = document.querySelector(
    "[data-community-confession-group]",
);
const communitySpecialTimes = document.querySelector(
    "[data-community-special-times]",
);
const communitySpecialGroup = document.querySelector(
    "[data-community-special-group]",
);
const communityAddress = document.querySelector("[data-community-address]");
const communityMaps = document.querySelector("[data-community-maps]");
const communityWaze = document.querySelector("[data-community-waze]");

const comunidades = window.igrejasComunidades || [];
const comunidadesPorId = new Map(
    comunidades.map((comunidade) => [comunidade.id, comunidade]),
);

const GALLERY_AUTOPLAY_DELAY = 6200;
const GALLERY_INTERACTION_PAUSE = 7000;
const GALLERY_SWIPE_THRESHOLD = 45;
const MODAL_CLOSE_TRANSITION_DELAY = 240;

let comunidadeAtual = null;
let galleryIndex = 0;
let galleryTimer = null;
let galleryResumeTimer = null;
let modalLastFocusedElement = null;
let modalLockedScrollY = 0;
let galleryPointerStartX = 0;
let galleryPointerStartY = 0;
let galleryPointerDown = false;

function getCommunityCardById(id) {
    if (!id) return null;

    if (window.CSS?.escape) {
        return comunidadesGrid?.querySelector(
            `.comunidade-card[data-community-id="${CSS.escape(id)}"]`,
        );
    }

    return comunidadesGrid?.querySelector(
        `.comunidade-card[data-community-id="${id}"]`,
    );
}

function clearActiveCommunityCard() {
    comunidadesGrid
        ?.querySelectorAll(".comunidade-card.is-active")
        .forEach((card) => {
            card.classList.remove("is-active");
            card.setAttribute("aria-expanded", "false");
        });
}

function setActiveCommunityCard(id) {
    clearActiveCommunityCard();

    const activeCard = getCommunityCardById(id);

    if (!activeCard) return;

    activeCard.classList.add("is-active");
    activeCard.setAttribute("aria-expanded", "true");
}

/* =============================================
   CARDS
   ============================================= */

function createCommunityCard(comunidade) {
    const card = document.createElement("button");
    const imageWrapper = document.createElement("span");
    const content = document.createElement("span");
    const title = document.createElement("span");
    const hint = document.createElement("span");

    card.className = "comunidade-card";
    card.type = "button";
    card.dataset.communityId = comunidade.id;
    card.setAttribute("aria-label", `Abrir ${comunidade.nome}`);
    card.setAttribute("aria-expanded", "false");

    imageWrapper.className = "comunidade-card__image";

    if (comunidade.imagemPrincipal) {
        const image = document.createElement("img");

        image.src = comunidade.imagemPrincipal;
        image.alt = comunidade.imagemAlt;
        image.loading = "lazy";
        image.style.objectPosition = comunidade.objectPosition;
        image.style.setProperty(
            "--community-image-scale",
            comunidade.imagemScale || "1",
        );
        image.style.setProperty(
            "--community-image-origin",
            comunidade.imagemOrigin || comunidade.objectPosition,
        );

        imageWrapper.appendChild(image);
    } else {
        imageWrapper.classList.add("comunidade-card__image--fallback");
    }

    content.className = "comunidade-card__content";
    title.className = "comunidade-card__title";
    hint.className = "comunidade-card__hint";

    title.textContent = comunidade.nome;
    hint.textContent = "Abrir detalhes";

    content.append(title, hint);
    card.append(imageWrapper, content);

    card.addEventListener("click", () => {
        abrirModalIgreja(comunidade.id);
    });

    return card;
}

function renderCommunityCards() {
    if (!comunidadesGrid) return;

    const fragment = document.createDocumentFragment();

    comunidades.forEach((comunidade) => {
        fragment.appendChild(createCommunityCard(comunidade));
    });

    comunidadesGrid.appendChild(fragment);
}

/* =============================================
   SCROLL
   ============================================= */

function lockModalScroll() {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

    modalLockedScrollY = window.scrollY;
    window.__suspendHeaderVisibility = true;

    document.body.style.setProperty(
        "--modal-locked-scroll-y",
        `${modalLockedScrollY}px`,
    );
    document.body.style.setProperty(
        "--modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.body.style.setProperty(
        "--active-modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.documentElement.classList.add("modal-scroll-locked");
    document.body.classList.add("community-modal-open");
}

function unlockModalScroll() {
    const scrollY = modalLockedScrollY;

    document.body.classList.remove("community-modal-open");
    document.documentElement.classList.remove("modal-scroll-locked");
    document.body.style.removeProperty("--modal-locked-scroll-y");
    document.body.style.removeProperty("--modal-page-scrollbar-width");
    document.body.style.removeProperty("--active-modal-page-scrollbar-width");

    window.scrollTo(0, scrollY);

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);

        requestAnimationFrame(() => {
            window.__suspendHeaderVisibility = false;
        });
    });
}

/* =============================================
   MODAL
   ============================================= */

function renderSchedule(container, items) {
    container.innerHTML = "";

    const list = document.createElement("div");

    list.className = "community-schedule-list";

    items.forEach((item) => {
        const row = document.createElement("div");
        const day = document.createElement("span");
        const timeWrapper = document.createElement("span");
        const time = document.createElement("strong");

        row.className = "community-schedule-item";
        day.className = "community-schedule-item__day";
        timeWrapper.className = "community-schedule-item__time";

        day.textContent = item.dia;
        time.textContent = item.horario;

        timeWrapper.appendChild(time);

        if (item.observacao) {
            const note = document.createElement("small");

            note.textContent = item.observacao;
            timeWrapper.appendChild(note);
        }

        row.append(day, timeWrapper);
        list.appendChild(row);
    });

    container.appendChild(list);
}

function renderSpecialCelebrations(container, items) {
    container.innerHTML = "";

    items.forEach((item) => {
        const card = document.createElement("div");
        const name = document.createElement("strong");
        const day = document.createElement("span");
        const time = document.createElement("span");

        card.className = "community-special-item";
        name.textContent = item.nome;
        day.textContent = item.dia;
        time.textContent = item.horario;

        card.append(name, day, time);

        if (item.observacao) {
            const note = document.createElement("small");

            note.textContent = item.observacao;
            card.appendChild(note);
        }

        container.appendChild(card);
    });
}

function updateOptionalGroup(group, container, items, render) {
    if (!group || !container) return;

    if (!items.length) {
        group.hidden = true;
        container.innerHTML = "";
        return;
    }

    group.hidden = false;
    render(container, items);
}

function updateModalLinks(comunidade) {
    updateModalLink(communityMaps, comunidade.googleMaps);
    updateModalLink(communityWaze, comunidade.waze);
}

function updateModalLink(link, href) {
    if (!href) {
        link.hidden = true;
        link.removeAttribute("href");
        return;
    }

    link.hidden = false;
    link.href = href;
}

function fillModalInfo(comunidade) {
    communityTitle.textContent = comunidade.nome;
    communitySubtitle.textContent = comunidade.subtitulo || "";
    communitySubtitle.hidden = !comunidade.subtitulo;
    communityAddress.textContent =
        comunidade.endereco || "Informações em atualização.";

    renderSchedule(communityMassTimes, comunidade.missas);
    updateOptionalGroup(
        communityConfessionGroup,
        communityConfessionTimes,
        comunidade.confissoes,
        renderSchedule,
    );
    updateOptionalGroup(
        communitySpecialGroup,
        communitySpecialTimes,
        comunidade.celebracoesEspeciais || [],
        renderSpecialCelebrations,
    );
    updateModalLinks(comunidade);
}

function openModal(comunidade) {
    comunidadeAtual = comunidade;
    modalLastFocusedElement = document.activeElement;

    setActiveCommunityCard(comunidade.id);
    fillModalInfo(comunidade);
    communityModal.classList.add("is-loading");
    const galleryReady = renderGallery(comunidade.galeria);
    lockModalScroll();

    communityModal.hidden = false;
    communityModalOverlay.hidden = false;
    communityModal.setAttribute("aria-hidden", "false");
    communityModalOverlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        communityModal.classList.add("active");
        communityModalOverlay.classList.add("active");
        communityModal.focus();
    });

    galleryReady.finally(() => {
        if (comunidadeAtual !== comunidade) return;

        communityModal.classList.remove("is-loading");
    });
}

function closeModal() {
    if (!communityModal?.classList.contains("active")) return;

    stopGalleryAutoplay();

    communityModal.classList.remove("active");
    communityModal.classList.remove("is-loading");
    communityModalOverlay.classList.remove("active");
    communityModal.setAttribute("aria-hidden", "true");
    communityModalOverlay.setAttribute("aria-hidden", "true");
    unlockModalScroll();

    setTimeout(() => {
        communityModal.hidden = true;
        communityModalOverlay.hidden = true;
        communityGallery.innerHTML = "";
        communityGalleryDots.innerHTML = "";
        comunidadeAtual = null;
        clearActiveCommunityCard();

        if (
            modalLastFocusedElement &&
            document.contains(modalLastFocusedElement)
        ) {
            modalLastFocusedElement.focus({ preventScroll: true });
        }
    }, MODAL_CLOSE_TRANSITION_DELAY);
}

function abrirModalIgreja(id) {
    const comunidade = comunidadesPorId.get(id);

    if (!comunidade) return false;

    openModal(comunidade);

    return true;
}

window.abrirModalIgreja = abrirModalIgreja;

function getModalFocusableElements() {
    return Array.from(
        communityModal.querySelectorAll(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
    ).filter((element) => !element.hidden);
}

/* =============================================
   GALERIA
   ============================================= */

function getGalleryItems(galeria) {
    if (galeria.length) return galeria;

    return [
        {
            src: "",
            alt: comunidadeAtual?.nome || "Comunidade",
            objectPosition: "center center",
        },
    ];
}

function waitForGalleryImage(image) {
    if (!image) return Promise.resolve();

    return new Promise((resolve) => {
        const finish = () => {
            if (image.complete && image.naturalWidth > 0) {
                if (typeof image.decode === "function") {
                    image.decode().catch(() => {}).finally(resolve);
                } else {
                    resolve();
                }

                return;
            }

            resolve();
        };

        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", resolve, { once: true });

        if (image.complete) {
            finish();
        }
    });
}

function renderGallery(galeria) {
    const galleryItems = getGalleryItems(galeria);

    galleryIndex = 0;
    communityGallery.innerHTML = "";
    communityGalleryDots.innerHTML = "";
    const galleryImagesReady = [];

    galleryItems.forEach((item, index) => {
        const slide = document.createElement("div");

        slide.className = "community-gallery__slide";
        slide.setAttribute("aria-hidden", index === 0 ? "false" : "true");

        if (index === 0) {
            slide.classList.add("active");
        }

        if (item.src) {
            const image = document.createElement("img");

            image.alt = item.alt;
            image.loading = "eager";
            image.style.objectPosition = item.objectPosition;
            image.style.setProperty(
                "--community-image-scale",
                item.scale || "1",
            );
            image.style.setProperty(
                "--community-image-origin",
                item.origin || item.objectPosition,
            );

            galleryImagesReady.push(waitForGalleryImage(image));

            image.src = item.src;
            slide.appendChild(image);
        } else {
            slide.classList.add("community-gallery__slide--fallback");
            slide.textContent = "Fotos em atualização";
        }

        communityGallery.appendChild(slide);

        const dot = document.createElement("button");

        dot.className = "community-gallery__dot";
        dot.type = "button";
        dot.setAttribute("aria-label", `Foto ${index + 1}`);
        dot.setAttribute("aria-current", index === 0 ? "true" : "false");

        dot.addEventListener("click", () => {
            pauseGalleryAfterInteraction();
            goToGallerySlide(index);
        });

        communityGalleryDots.appendChild(dot);
    });

    updateGalleryControls(galleryItems.length);
    startGalleryAutoplay();

    return Promise.all(galleryImagesReady);
}

function getGallerySlides() {
    return Array.from(
        communityGallery.querySelectorAll(".community-gallery__slide"),
    );
}

function getGalleryDots() {
    return Array.from(
        communityGalleryDots.querySelectorAll(".community-gallery__dot"),
    );
}

function updateGalleryControls(total) {
    const shouldShowControls = total > 1;

    communityGalleryPrev.hidden = !shouldShowControls;
    communityGalleryNext.hidden = !shouldShowControls;
    communityGalleryDots.hidden = !shouldShowControls;
}

function goToGallerySlide(nextIndex) {
    const slides = getGallerySlides();
    const dots = getGalleryDots();

    if (!slides.length) return;

    const normalizedIndex = (nextIndex + slides.length) % slides.length;

    if (normalizedIndex === galleryIndex) return;

    slides[galleryIndex].classList.remove("active");
    slides[galleryIndex].setAttribute("aria-hidden", "true");
    dots[galleryIndex]?.setAttribute("aria-current", "false");

    galleryIndex = normalizedIndex;

    slides[galleryIndex].classList.add("active");
    slides[galleryIndex].setAttribute("aria-hidden", "false");
    dots[galleryIndex]?.setAttribute("aria-current", "true");
}

function nextGallerySlide() {
    goToGallerySlide(galleryIndex + 1);
}

function previousGallerySlide() {
    goToGallerySlide(galleryIndex - 1);
}

function startGalleryAutoplay() {
    const slides = getGallerySlides();

    stopGalleryAutoplay();

    if (slides.length <= 1) return;

    galleryTimer = setInterval(nextGallerySlide, GALLERY_AUTOPLAY_DELAY);
}

function stopGalleryAutoplay() {
    clearInterval(galleryTimer);
    clearTimeout(galleryResumeTimer);
}

function pauseGalleryAfterInteraction() {
    stopGalleryAutoplay();

    galleryResumeTimer = setTimeout(
        startGalleryAutoplay,
        GALLERY_INTERACTION_PAUSE,
    );
}

communityGalleryPrev?.addEventListener("click", () => {
    pauseGalleryAfterInteraction();
    previousGallerySlide();
});

communityGalleryNext?.addEventListener("click", () => {
    pauseGalleryAfterInteraction();
    nextGallerySlide();
});

communityGallery?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    galleryPointerDown = true;
    galleryPointerStartX = event.clientX;
    galleryPointerStartY = event.clientY;
    pauseGalleryAfterInteraction();
});

communityGallery?.addEventListener("pointerup", (event) => {
    if (!galleryPointerDown) return;

    const deltaX = event.clientX - galleryPointerStartX;
    const deltaY = event.clientY - galleryPointerStartY;

    galleryPointerDown = false;

    if (Math.abs(deltaX) < GALLERY_SWIPE_THRESHOLD) return;
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;

    deltaX < 0 ? nextGallerySlide() : previousGallerySlide();
});

communityGallery?.addEventListener("pointercancel", () => {
    galleryPointerDown = false;
});

communityGallery?.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
        stopGalleryAutoplay();
    }
});

communityGallery?.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
        pauseGalleryAfterInteraction();
    }
});

/* =============================================
   EVENTOS
   ============================================= */

communityModalClose?.addEventListener("click", closeModal);
communityModalOverlay?.addEventListener("click", closeModal);

communityModal?.addEventListener("click", (event) => {
    if (communityModalDialog?.contains(event.target)) return;

    closeModal();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal();
        return;
    }

    if (event.key !== "Tab") return;
    if (!communityModal?.classList.contains("active")) return;

    const focusableElements = getModalFocusableElements();

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

renderCommunityCards();
