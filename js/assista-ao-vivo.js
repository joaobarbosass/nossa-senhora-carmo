const liveStreamConfig = {
    channelName: "Paróquia Nossa Senhora do Carmo",
    channelUrl: "https://www.youtube.com/@par%C3%B3quianossasenhoradocarmomc",
    videoEmbedUrl: "",
    iframeTitle: "Transmissão da Paróquia Nossa Senhora do Carmo",
};

const liveSection = document.querySelector("[data-live-section]");
const livePlayer = liveSection?.querySelector("[data-live-player]");
const liveChannelLink = liveSection?.querySelector("[data-live-channel-link]");

function createLivePlaceholder() {
    const placeholder = document.createElement("div");
    placeholder.className = "live-section__placeholder";
    placeholder.innerHTML = `
        <span class="material-symbols-outlined" aria-hidden="true">play_circle</span>
        <p>As transmissões da paróquia aparecerão aqui quando houver um vídeo cadastrado.</p>
    `;

    return placeholder;
}

function createLiveIframe(embedUrl) {
    const iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.title = liveStreamConfig.iframeTitle;
    iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    return iframe;
}

if (liveChannelLink) {
    liveChannelLink.href = liveStreamConfig.channelUrl;
    liveChannelLink.setAttribute(
        "aria-label",
        `Ver canal ${liveStreamConfig.channelName} no YouTube`
    );
}

if (livePlayer) {
    const embedUrl = liveStreamConfig.videoEmbedUrl.trim();
    livePlayer.replaceChildren(
        embedUrl ? createLiveIframe(embedUrl) : createLivePlaceholder()
    );
}
