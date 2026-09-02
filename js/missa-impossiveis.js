const impossibleMassSection = document.querySelector("[data-impossible-mass]");
const impossibleMassLocationLink = impossibleMassSection?.querySelector(
    "[data-impossible-mass-location]",
);
const matrizCommunity = (window.igrejasComunidades || []).find(
    (comunidade) => comunidade.id === "matriz",
);

function revealImpossibleMassSection() {
    impossibleMassSection?.classList.add("is-visible");
}

function setupImpossibleMassLocation() {
    const locationUrl = matrizCommunity?.googleMaps || matrizCommunity?.waze;

    if (!impossibleMassLocationLink || !locationUrl) return;

    impossibleMassLocationLink.href = locationUrl;
    impossibleMassLocationLink.hidden = false;
}

if (impossibleMassSection) {
    setupImpossibleMassLocation();

    const shouldReduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;

    if (shouldReduceMotion || !("IntersectionObserver" in window)) {
        revealImpossibleMassSection();
    } else {
        const impossibleMassObserver = new IntersectionObserver(
            ([entry], observer) => {
                if (!entry.isIntersecting) return;

                revealImpossibleMassSection();
                observer.disconnect();
            },
            { threshold: 0.32 },
        );

        impossibleMassObserver.observe(impossibleMassSection);
    }
}
