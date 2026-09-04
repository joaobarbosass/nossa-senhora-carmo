function createLoadingScreen() {
    if (!document.body) return;

    let loading = document.getElementById("loading-screen");

    if (!loading) {
        loading = document.createElement("div");

        loading.id = "loading-screen";
        loading.setAttribute("aria-live", "polite");

        loading.innerHTML = `
            <div class="loading-content">
                <span class="loading-spinner" aria-hidden="true"></span>
            </div>
        `;

        document.body.prepend(loading);
    }

    loading.setAttribute("aria-busy", "true");
    document.documentElement.classList.add("app-loading");
    document.body.classList.add("loading");
}

createLoadingScreen();

if (!document.body) {
    document.addEventListener("DOMContentLoaded", createLoadingScreen, {
        once: true,
    });
}

let loadingFinalizado = false;

window.hideLoading = function () {
    const loadingScreen = document.getElementById("loading-screen");

    if (!loadingScreen || loadingFinalizado) return;

    loadingFinalizado = true;
    let loadingRemovido = false;

    const finalizarLoading = () => {
        if (loadingRemovido) return;

        loadingRemovido = true;

        document.body.classList.remove("loading");
        document.body.classList.remove("loading-fade-out");
        document.documentElement.classList.remove("app-loading");

        const themeColor = document.querySelector(
            'meta[name="theme-color"][data-ready-color]',
        );

        if (themeColor) {
            themeColor.setAttribute("content", themeColor.dataset.readyColor);
        }

        if (loadingScreen.parentNode) {
            loadingScreen.remove();
        }
    };

    document.body.classList.add("loading-fade-out");

    loadingScreen.classList.add("hidden");
    loadingScreen.setAttribute("aria-busy", "false");

    loadingScreen.addEventListener(
        "transitionend",
        (event) => {
            if (event.propertyName === "opacity") {
                finalizarLoading();
            }
        },
        { once: true },
    );

    setTimeout(() => {
        finalizarLoading();
    }, 760);
};
