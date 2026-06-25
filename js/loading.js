const loading = document.createElement("div");

loading.id = "loading-screen";

loading.innerHTML = `
    <div class="loading-spinner"></div>
`;

document.body.prepend(loading);

document.body.classList.add("loading");

window.hideLoading = function () {
    const loadingScreen = document.getElementById("loading-screen");

    if (!loadingScreen) return;

    loadingScreen.classList.add("hidden");

    document.body.classList.remove("loading");

    setTimeout(() => {
        loadingScreen.remove();
    }, 300);
};
