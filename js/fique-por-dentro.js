const agendaSection = document.querySelector("[data-parish-agenda]");
const agendaTimeline = document.querySelector("[data-agenda-timeline]");
const agendaWeekStart = document.querySelector("[data-agenda-week-start]");
const agendaWeekEnd = document.querySelector("[data-agenda-week-end]");
const agendaRemaining = document.querySelector("[data-agenda-remaining]");
const agendaOpenButton = document.querySelector("[data-agenda-open]");
const agendaModal = document.querySelector("[data-agenda-modal]");
const agendaModalDialog = document.querySelector(".agenda-modal__dialog");
const agendaModalOverlay = document.querySelector("[data-agenda-modal-overlay]");
const agendaModalClose = document.querySelector("[data-agenda-close]");
const agendaModalContent = document.querySelector("[data-agenda-modal-content]");

let agendaEventos = [];
let agendaEventosPendentes = null;
let agendaEventSignatures = new Map();
let agendaSilentUpdateInProgress = false;
let agendaUpdateNotification = null;
let agendaUpdateNotificationTimer = null;
let agendaUpdateNotificationCloseTimer = null;
let agendaUpdateNotificationContentTimer = null;
let agendaUpdateNotificationSwipe = null;
let agendaUpdateNotificationSuppressClick = false;
let agendaUpdateNotificationSuppressClickTimer = null;
let agendaUpdateNotificationDismissDelay = 0;
const AGENDA_HOME_EVENT_LIMIT = 5;
const AGENDA_MODAL_CLOSE_TRANSITION_DELAY = 240;
const AGENDA_SILENT_POLL_INTERVAL = 5 * 60 * 1000;
const AGENDA_SILENT_POLLING_ENABLED = false;
// Modo temporário para teste visual da notificação. Manter false em produção.
const AGENDA_UPDATE_NOTIFICATION_TEST_ENABLED = false;
const AGENDA_UPDATE_NOTIFICATION_TEST_INTERVAL = 10000;
const AGENDA_UPDATE_NOTIFICATION_DELAY = 9000;
const AGENDA_UPDATE_NOTIFICATION_EXIT_DELAY = 960;
const AGENDA_UPDATE_NOTIFICATION_CONTENT_DELAY = 1250;
const AGENDA_HIGHLIGHT_CLEAR_DELAY = 650;
const AGENDA_SWIPE_START_THRESHOLD = 8;
const AGENDA_SWIPE_DIRECTION_RATIO = 1.2;
const AGENDA_SWIPE_DISMISS_RATIO = 0.3;
const AGENDA_SWIPE_MIN_DISMISS_DISTANCE = 72;
const AGENDA_SWIPE_EXIT_DELAY = 220;

let agendaModalLastFocusedElement = null;
let agendaModalLockedScrollY = 0;
let agendaModalTouchLastY = null;

function createLocalDate(dateValue) {
    const [year, month, day] = dateValue.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function createLocalDateTime(dateValue, timeValue, useEndOfDay = false) {
    const date = createLocalDate(dateValue);

    if (!timeValue) {
        date.setHours(useEndOfDay ? 23 : 0, useEndOfDay ? 59 : 0, 0, 0);
        return date;
    }

    const [hours, minutes] = timeValue.split(":").map(Number);

    date.setHours(hours, minutes || 0, 0, 0);

    return date;
}

function getStartOfDay(date) {
    const nextDate = new Date(date);

    nextDate.setHours(0, 0, 0, 0);

    return nextDate;
}

function getEndOfDay(date) {
    const nextDate = new Date(date);

    nextDate.setHours(23, 59, 59, 999);

    return nextDate;
}

function addDays(date, amount) {
    const nextDate = new Date(date);

    nextDate.setDate(nextDate.getDate() + amount);

    return nextDate;
}

function getWeekRange(referenceDate = new Date()) {
    const start = getStartOfDay(referenceDate);
    const dayOffset = (start.getDay() + 6) % 7;

    start.setDate(start.getDate() - dayOffset);

    return {
        start,
        end: getEndOfDay(addDays(start, 6)),
    };
}

function normalizeEvent(evento) {
    const startDate = createLocalDateTime(evento.dataInicio, evento.horaInicio);
    const endDate = createLocalDateTime(
        evento.dataFim || evento.dataInicio,
        evento.horaFim || evento.horaInicio,
        !evento.horaFim && !evento.horaInicio,
    );

    return {
        ...evento,
        startDate,
        endDate,
    };
}

function formatDateShort(date) {
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
    })
        .format(date)
        .replace(".", "")
        .toUpperCase();
}

function formatMonthTitle(date) {
    return new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
    })
        .format(date)
        .toUpperCase();
}

function formatWeekdayShort(date) {
    return new Intl.DateTimeFormat("pt-BR", {
        weekday: "short",
    })
        .format(date)
        .replace(".", "")
        .toUpperCase();
}

function isSameCalendarDay(firstDate, secondDate) {
    return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
    );
}

function isSameCalendarMonth(firstDate, secondDate) {
    return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth()
    );
}

function formatEventDateLabel(evento) {
    if (isSameCalendarDay(evento.startDate, evento.endDate)) {
        return String(evento.startDate.getDate()).padStart(2, "0");
    }

    if (isSameCalendarMonth(evento.startDate, evento.endDate)) {
        return `${String(evento.startDate.getDate()).padStart(2, "0")} - ${String(
            evento.endDate.getDate(),
        ).padStart(2, "0")}`;
    }

    return `${formatDateShort(evento.startDate)} - ${formatDateShort(
        evento.endDate,
    )}`;
}

function formatEventWeekdayLabel(evento) {
    const startWeekday = formatWeekdayShort(evento.startDate);

    if (isSameCalendarDay(evento.startDate, evento.endDate)) {
        return startWeekday;
    }

    return `${startWeekday} - ${formatWeekdayShort(evento.endDate)}`;
}

function formatEventTime(evento) {
    if (evento.horario) return evento.horario;
    if (!evento.horaInicio) return "Horário em atualização";

    const startTime = evento.horaInicio.replace(":", "h");

    if (!evento.horaFim || evento.horaFim === evento.horaInicio) {
        return startTime;
    }

    return `${startTime} às ${evento.horaFim.replace(":", "h")}`;
}

function getEventStatus(evento, referenceDate = new Date()) {
    const todayStart = getStartOfDay(referenceDate);
    const todayEnd = getEndOfDay(referenceDate);
    const tomorrowStart = getStartOfDay(addDays(referenceDate, 1));
    const tomorrowEnd = getEndOfDay(tomorrowStart);
    const isToday =
        evento.startDate <= todayEnd && evento.endDate >= todayStart;
    const isTomorrow =
        evento.startDate <= tomorrowEnd && evento.endDate >= tomorrowStart;
    const isPast = evento.endDate < referenceDate;

    if (isPast) return "past";
    if (isToday) return "today";
    if (isTomorrow) return "tomorrow";

    return "future";
}

function isEventInRange(evento, startDate, endDate) {
    return evento.startDate <= endDate && evento.endDate >= startDate;
}

function sortEvents(events) {
    return [...events].sort((firstEvent, secondEvent) => {
        return firstEvent.startDate - secondEvent.startDate;
    });
}

function getAgendaComparableFields(evento) {
    return {
        id: evento.id || "",
        titulo: evento.titulo || "",
        dataInicio: evento.dataInicio || "",
        horaInicio: evento.horaInicio || "",
        dataFim: evento.dataFim || "",
        horaFim: evento.horaFim || "",
        local: evento.local || "",
        descricao: evento.descricao || "",
    };
}

function getAgendaEventSignature(evento) {
    return JSON.stringify(getAgendaComparableFields(evento));
}

function createAgendaSignatureMap(events) {
    const signatures = new Map();

    events.forEach((evento) => {
        if (!evento.id) return;

        signatures.set(evento.id, getAgendaEventSignature(evento));
    });

    return signatures;
}

function getChangedAgendaEventIds(currentSignatures, nextSignatures) {
    const changedIds = new Set();

    nextSignatures.forEach((signature, id) => {
        if (currentSignatures.get(id) !== signature) {
            changedIds.add(id);
        }
    });

    return changedIds;
}

function hasAgendaChanged(currentSignatures, nextSignatures) {
    if (currentSignatures.size !== nextSignatures.size) return true;

    for (const [id, signature] of nextSignatures) {
        if (currentSignatures.get(id) !== signature) {
            return true;
        }
    }

    return false;
}

function createEventCard(evento, status, isCompact = false) {
    const card = document.createElement("article");
    const date = document.createElement("time");
    const dateDay = document.createElement("strong");
    const dateWeekday = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");

    card.className = "agenda-event";
    card.classList.add(`agenda-event--${status}`);

    if (isCompact) {
        card.classList.add("agenda-event--compact");
    }

    date.className = "agenda-event__date";
    date.dateTime = evento.dataInicio;

    if (!isSameCalendarDay(evento.startDate, evento.endDate)) {
        card.classList.add("agenda-event--range");
        date.dateTime = `${evento.dataInicio}/${evento.dataFim || evento.dataInicio}`;
    }

    dateDay.textContent = formatEventDateLabel(evento);
    dateWeekday.textContent = formatEventWeekdayLabel(evento);

    content.className = "agenda-event__content";
    title.textContent = evento.titulo;
    meta.textContent = `${formatEventTime(evento)} • ${evento.local || "Local em atualização"}`;

    date.append(dateDay, dateWeekday);
    content.append(title, meta);

    if (evento.descricao) {
        const description = document.createElement("p");

        description.className = "agenda-event__description";
        description.textContent = evento.descricao;
        content.appendChild(description);
    }

    const statusLabels = {
        past: "Realizado",
        today: "Hoje",
        tomorrow: "Amanhã",
    };

    if (statusLabels[status]) {
        const statusLabel = document.createElement("span");

        statusLabel.className = "agenda-event__status";
        statusLabel.textContent = statusLabels[status];
        content.appendChild(statusLabel);
    }

    card.append(date, content);

    return card;
}

function renderWeekRange(weekRange) {
    if (!agendaWeekStart || !agendaWeekEnd) return;

    agendaWeekStart.textContent = formatDateShort(weekRange.start);
    agendaWeekEnd.textContent = formatDateShort(weekRange.end);
}

function renderEmptyTimeline() {
    if (!agendaTimeline) return;

    const empty = document.createElement("div");

    empty.className = "parish-agenda__empty";
    empty.textContent = "Sem eventos cadastrados para esta semana.";

    agendaTimeline.innerHTML = "";
    agendaTimeline.appendChild(empty);
}

function renderAgendaState(message, modifier) {
    if (!agendaTimeline) return;

    const state = document.createElement("div");

    state.className = "parish-agenda__state";

    if (modifier) {
        state.classList.add(`parish-agenda__state--${modifier}`);
    }

    state.textContent = message;
    agendaTimeline.innerHTML = "";
    agendaTimeline.appendChild(state);
}

function renderAgendaLoading() {
    renderAgendaState("Carregando agenda...", "loading");
}

function renderAgendaError() {
    renderAgendaState(
        "Não foi possível carregar os eventos no momento.",
        "error",
    );
}

function isAgendaSectionVisible() {
    if (!agendaSection) return false;

    const rect = agendaSection.getBoundingClientRect();
    const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(visibleBottom - visibleTop, 0);
    const minimumVisibleHeight = Math.min(rect.height * 0.25, 220);

    return visibleHeight >= Math.max(minimumVisibleHeight, 120);
}

function isAgendaModalOpen() {
    return Boolean(agendaModal?.classList.contains("active"));
}

function getAgendaUpdateNotification() {
    if (agendaUpdateNotification) return agendaUpdateNotification;

    const notification = document.createElement("div");
    const surface = document.createElement("div");
    const reveal = document.createElement("div");
    const dot = document.createElement("span");
    const content = document.createElement("div");
    const title = document.createElement("strong");
    const message = document.createElement("span");
    const action = document.createElement("button");
    const close = document.createElement("button");
    const closeIcon = document.createElement("span");

    notification.className = "agenda-update-notification";
    notification.setAttribute("aria-live", "polite");
    notification.setAttribute("aria-atomic", "true");
    notification.hidden = true;

    surface.className = "agenda-update-notification__surface";
    reveal.className = "agenda-update-notification__reveal";
    dot.className = "agenda-update-notification__dot";
    dot.setAttribute("aria-hidden", "true");

    content.className = "agenda-update-notification__content";
    title.className = "agenda-update-notification__title";
    title.dataset.agendaUpdateTitle = "";
    message.className = "agenda-update-notification__message";
    message.dataset.agendaUpdateMessage = "";

    action.className = "agenda-update-notification__action";
    action.type = "button";
    action.dataset.agendaUpdateAction = "";
    action.textContent = "Ver agenda";

    close.className = "agenda-update-notification__close";
    close.type = "button";
    close.setAttribute("aria-label", "Fechar notificação");
    close.dataset.agendaUpdateClose = "";

    closeIcon.className = "material-symbols-outlined";
    closeIcon.setAttribute("aria-hidden", "true");
    closeIcon.textContent = "close";

    content.append(title, message);
    close.appendChild(closeIcon);
    reveal.append(dot, content, action, close);
    surface.appendChild(reveal);
    notification.appendChild(surface);
    document.body.appendChild(notification);

    action.addEventListener("click", (event) => {
        event.stopPropagation();
        closeAgendaUpdateNotification();
        navigateToAgendaSection();
    });

    close.addEventListener("click", (event) => {
        event.stopPropagation();
        closeAgendaUpdateNotification();
    });
    notification.addEventListener("mouseenter", clearAgendaUpdateNotificationTimer);
    notification.addEventListener("focusin", clearAgendaUpdateNotificationTimer);
    notification.addEventListener("mouseleave", scheduleAgendaUpdateNotificationDismiss);
    notification.addEventListener("focusout", scheduleAgendaUpdateNotificationDismiss);
    surface.addEventListener("click", suppressAgendaNotificationSwipeClick, true);
    surface.addEventListener("click", closeAgendaNotificationFromSurfaceClick);
    surface.addEventListener("pointerdown", startAgendaNotificationSwipe);
    surface.addEventListener("pointermove", moveAgendaNotificationSwipe);
    surface.addEventListener("pointerup", endAgendaNotificationSwipe);
    surface.addEventListener("pointercancel", cancelAgendaNotificationSwipe);

    agendaUpdateNotification = notification;

    return notification;
}

function clearAgendaUpdateNotificationTimer() {
    if (!agendaUpdateNotificationTimer) return;

    clearTimeout(agendaUpdateNotificationTimer);
    agendaUpdateNotificationTimer = null;
}

function clearAgendaUpdateNotificationContentTimer() {
    if (!agendaUpdateNotificationContentTimer) return;

    clearTimeout(agendaUpdateNotificationContentTimer);
    agendaUpdateNotificationContentTimer = null;
}

function resetAgendaNotificationSwipeStyles(surface) {
    surface?.style.removeProperty("--agenda-notification-drag-x");
    surface?.style.removeProperty("--agenda-notification-drag-opacity");
}

function clearAgendaNotificationClickSuppression() {
    if (agendaUpdateNotificationSuppressClickTimer) {
        clearTimeout(agendaUpdateNotificationSuppressClickTimer);
        agendaUpdateNotificationSuppressClickTimer = null;
    }

    agendaUpdateNotificationSuppressClick = false;
}

function suppressNextAgendaNotificationClick() {
    agendaUpdateNotificationSuppressClick = true;

    if (agendaUpdateNotificationSuppressClickTimer) {
        clearTimeout(agendaUpdateNotificationSuppressClickTimer);
    }

    agendaUpdateNotificationSuppressClickTimer = setTimeout(() => {
        agendaUpdateNotificationSuppressClick = false;
        agendaUpdateNotificationSuppressClickTimer = null;
    }, 500);
}

function suppressAgendaNotificationSwipeClick(event) {
    if (!agendaUpdateNotificationSuppressClick) return;

    event.preventDefault();
    event.stopPropagation();
    clearAgendaNotificationClickSuppression();
}

function closeAgendaNotificationFromSurfaceClick(event) {
    event.stopPropagation();

    if (!isAgendaModalOpen()) return;
    if (event.target.closest(".agenda-update-notification__action")) return;
    if (event.target.closest(".agenda-update-notification__close")) return;

    closeAgendaUpdateNotification();
}

function shouldReduceAgendaNotificationMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function releaseAgendaNotificationSwipePointer(surface, pointerId) {
    try {
        surface?.releasePointerCapture?.(pointerId);
    } catch (error) {
        return;
    }
}

function getAgendaSwipeDismissDistance(surface) {
    const width = surface?.offsetWidth || 0;

    return Math.max(
        width * AGENDA_SWIPE_DISMISS_RATIO,
        AGENDA_SWIPE_MIN_DISMISS_DISTANCE,
    );
}

function finishAgendaNotificationSwipeReset(surface) {
    agendaUpdateNotification?.classList.add("is-swipe-returning");
    agendaUpdateNotification?.classList.remove("is-dragging");

    resetAgendaNotificationSwipeStyles(surface);
    scheduleAgendaUpdateNotificationDismiss();

    setTimeout(() => {
        agendaUpdateNotification?.classList.remove("is-swipe-returning");
    }, AGENDA_SWIPE_EXIT_DELAY);
}

function finishAgendaNotificationSwipeDismiss(surface, direction) {
    const notificationWidth = agendaUpdateNotification?.offsetWidth || 0;
    const surfaceWidth = surface?.offsetWidth || 0;
    const exitDistance = direction * (notificationWidth + surfaceWidth);

    clearAgendaUpdateNotificationTimer();
    clearAgendaUpdateNotificationContentTimer();
    agendaUpdateNotification?.classList.add("is-swipe-dismissing");
    agendaUpdateNotification?.classList.remove(
        "is-dragging",
        "is-visible",
        "is-content-visible",
    );
    surface?.style.setProperty(
        "--agenda-notification-drag-x",
        `${exitDistance}px`,
    );
    surface?.style.setProperty("--agenda-notification-drag-opacity", "0");

    agendaUpdateNotificationCloseTimer = setTimeout(() => {
        if (!agendaUpdateNotification) return;

        agendaUpdateNotification.hidden = true;
        agendaUpdateNotification.classList.remove(
            "is-swipe-dismissing",
            "is-dismissible",
        );
        resetAgendaNotificationSwipeStyles(surface);
        agendaUpdateNotificationCloseTimer = null;
    }, AGENDA_SWIPE_EXIT_DELAY);
}

function startAgendaNotificationSwipe(event) {
    if (event.pointerType !== "touch") return;
    if (!agendaUpdateNotification?.classList.contains("is-visible")) return;

    clearAgendaUpdateNotificationTimer();

    agendaUpdateNotificationSwipe = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: 0,
        intent: null,
        surface: event.currentTarget,
    };
}

function moveAgendaNotificationSwipe(event) {
    const swipe = agendaUpdateNotificationSwipe;

    if (!swipe || event.pointerId !== swipe.pointerId) return;

    const deltaX = event.clientX - swipe.startX;
    const deltaY = event.clientY - swipe.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!swipe.intent) {
        if (Math.max(absX, absY) < AGENDA_SWIPE_START_THRESHOLD) return;

        if (absY > absX * AGENDA_SWIPE_DIRECTION_RATIO) {
            agendaUpdateNotificationSwipe = null;
            scheduleAgendaUpdateNotificationDismiss();
            return;
        }

        if (absX <= absY * AGENDA_SWIPE_DIRECTION_RATIO) return;

        swipe.intent = "horizontal";
        suppressNextAgendaNotificationClick();
        swipe.surface.setPointerCapture?.(event.pointerId);
        agendaUpdateNotification?.classList.add("is-dragging");
    }

    event.preventDefault();

    swipe.currentX = deltaX;

    const width = swipe.surface.offsetWidth || 1;
    const opacity = Math.max(0.28, 1 - Math.min(absX / (width * 0.9), 0.72));

    swipe.surface.style.setProperty(
        "--agenda-notification-drag-x",
        `${deltaX}px`,
    );
    swipe.surface.style.setProperty(
        "--agenda-notification-drag-opacity",
        String(opacity),
    );
}

function endAgendaNotificationSwipe(event) {
    const swipe = agendaUpdateNotificationSwipe;

    if (!swipe || event.pointerId !== swipe.pointerId) return;

    agendaUpdateNotificationSwipe = null;
    releaseAgendaNotificationSwipePointer(swipe.surface, event.pointerId);

    if (swipe.intent !== "horizontal") {
        scheduleAgendaUpdateNotificationDismiss();
        return;
    }

    const shouldDismiss =
        Math.abs(swipe.currentX) >= getAgendaSwipeDismissDistance(swipe.surface);

    if (shouldDismiss) {
        finishAgendaNotificationSwipeDismiss(
            swipe.surface,
            swipe.currentX < 0 ? -1 : 1,
        );
        return;
    }

    finishAgendaNotificationSwipeReset(swipe.surface);
}

function cancelAgendaNotificationSwipe(event) {
    const swipe = agendaUpdateNotificationSwipe;

    if (!swipe || event.pointerId !== swipe.pointerId) return;

    agendaUpdateNotificationSwipe = null;
    releaseAgendaNotificationSwipePointer(swipe.surface, event.pointerId);

    if (swipe.intent === "horizontal") {
        finishAgendaNotificationSwipeReset(swipe.surface);
        return;
    }

    scheduleAgendaUpdateNotificationDismiss();
}

function scheduleAgendaUpdateNotificationDismiss() {
    clearAgendaUpdateNotificationTimer();

    if (!agendaUpdateNotification?.classList.contains("is-dismissible")) {
        return;
    }

    agendaUpdateNotificationTimer = setTimeout(() => {
        closeAgendaUpdateNotification();
    }, agendaUpdateNotificationDismissDelay || AGENDA_UPDATE_NOTIFICATION_DELAY);
}

function showAgendaUpdateNotification({
    title: titleText = "A agenda foi atualizada",
    message = "",
    showAction = true,
    actionLabel = "Ver agenda",
    type = "update",
    dismissDelay = AGENDA_UPDATE_NOTIFICATION_DELAY,
    dismissible = showAction,
} = {}) {
    const notification = getAgendaUpdateNotification();
    const title = notification.querySelector("[data-agenda-update-title]");
    const description = notification.querySelector("[data-agenda-update-message]");
    const action = notification.querySelector("[data-agenda-update-action]");
    const surface = notification.querySelector(".agenda-update-notification__surface");

    clearAgendaUpdateNotificationTimer();
    clearAgendaUpdateNotificationContentTimer();
    clearAgendaNotificationClickSuppression();

    if (agendaUpdateNotificationCloseTimer) {
        clearTimeout(agendaUpdateNotificationCloseTimer);
        agendaUpdateNotificationCloseTimer = null;
    }

    title.textContent = titleText;
    description.textContent = message;
    description.hidden = !message;
    action.hidden = !showAction;
    action.textContent = actionLabel;
    agendaUpdateNotificationDismissDelay = dismissDelay;

    notification.hidden = false;
    notification.classList.remove(
        "agenda-update-notification--update",
        "is-visible",
        "is-content-visible",
        "is-hiding",
        "is-dismissible",
        "is-dragging",
        "is-swipe-returning",
        "is-swipe-dismissing",
    );
    notification.classList.add(`agenda-update-notification--${type}`);
    notification.dataset.agendaNotificationType = type;
    resetAgendaNotificationSwipeStyles(surface);

    if (dismissible) {
        notification.classList.add("is-dismissible");
    }

    surface.offsetWidth;

    requestAnimationFrame(() => {
        notification.classList.add("is-visible");

        const contentDelay = shouldReduceAgendaNotificationMotion()
            ? 40
            : AGENDA_UPDATE_NOTIFICATION_CONTENT_DELAY;

        agendaUpdateNotificationContentTimer = setTimeout(() => {
            notification.classList.add("is-content-visible");
            agendaUpdateNotificationContentTimer = null;
            scheduleAgendaUpdateNotificationDismiss();
        }, contentDelay);
    });
}

function closeAgendaUpdateNotification() {
    if (!agendaUpdateNotification || agendaUpdateNotification.hidden) return;

    const surface = agendaUpdateNotification.querySelector(
        ".agenda-update-notification__surface",
    );

    agendaUpdateNotificationSwipe = null;
    clearAgendaNotificationClickSuppression();
    clearAgendaUpdateNotificationTimer();
    clearAgendaUpdateNotificationContentTimer();
    agendaUpdateNotification.classList.add("is-hiding");
    agendaUpdateNotification.classList.remove(
        "is-visible",
        "is-content-visible",
        "is-dragging",
        "is-swipe-returning",
        "is-swipe-dismissing",
    );
    resetAgendaNotificationSwipeStyles(surface);

    const closeDelay = shouldReduceAgendaNotificationMotion()
        ? 140
        : AGENDA_UPDATE_NOTIFICATION_EXIT_DELAY;

    agendaUpdateNotificationCloseTimer = setTimeout(() => {
        if (!agendaUpdateNotification) return;

        agendaUpdateNotification.hidden = true;
        agendaUpdateNotification.classList.remove("is-hiding", "is-dismissible");
        agendaUpdateNotificationCloseTimer = null;
    }, closeDelay);
}

function navigateToAgendaSection() {
    if (!agendaSection) return;

    if (typeof navigateToPageSection === "function") {
        navigateToPageSection("#fique-por-dentro", agendaSection);
        return;
    }

    agendaSection.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "start",
    });
}

function renderHomeTimeline(events, referenceDate, highlightedIds = new Set()) {
    if (!agendaTimeline) return;

    agendaTimeline.innerHTML = "";

    if (!events.length) {
        renderEmptyTimeline();
        return;
    }

    events.forEach((evento) => {
        const item = document.createElement("div");
        const marker = document.createElement("span");
        const status = getEventStatus(evento, referenceDate);

        item.className = "parish-agenda__timeline-item";
        item.classList.add(`parish-agenda__timeline-item--${status}`);

        if (highlightedIds.has(evento.id)) {
            item.classList.add("parish-agenda__timeline-item--updated");
        }

        marker.className = "parish-agenda__timeline-marker";

        item.append(marker, createEventCard(evento, status));
        agendaTimeline.appendChild(item);
    });
}

function clearAgendaUpdatedHighlights() {
    agendaTimeline
        ?.querySelectorAll(".parish-agenda__timeline-item--updated")
        .forEach((item) => {
            item.classList.remove("parish-agenda__timeline-item--updated");
        });
}

function renderRemainingWeekEvents(totalEvents) {
    if (!agendaRemaining) return;

    const remainingEvents = totalEvents - AGENDA_HOME_EVENT_LIMIT;

    if (remainingEvents <= 0) {
        agendaRemaining.hidden = true;
        agendaRemaining.textContent = "";
        return;
    }

    agendaRemaining.hidden = false;
    agendaRemaining.textContent = `Ainda há ${remainingEvents} ${
        remainingEvents === 1 ? "evento" : "eventos"
    } nesta semana`;
}

function getWeekLabel(weekRange, currentWeekRange) {
    if (weekRange.start.getTime() === currentWeekRange.start.getTime()) {
        return "Esta semana";
    }

    if (
        weekRange.start.getTime() === addDays(currentWeekRange.start, 7).getTime()
    ) {
        return "Próxima semana";
    }

    return `${formatDateShort(weekRange.start)} — ${formatDateShort(weekRange.end)}`;
}

function groupEventsForModal(events, referenceDate) {
    const currentWeek = getWeekRange(referenceDate);
    const groups = new Map();

    events.forEach((evento) => {
        const monthKey = `${evento.startDate.getFullYear()}-${evento.startDate.getMonth()}`;
        const weekRange = getWeekRange(evento.startDate);
        const weekKey = weekRange.start.toISOString();

        if (!groups.has(monthKey)) {
            groups.set(monthKey, {
                title: formatMonthTitle(evento.startDate),
                weeks: new Map(),
            });
        }

        const monthGroup = groups.get(monthKey);

        if (!monthGroup.weeks.has(weekKey)) {
            monthGroup.weeks.set(weekKey, {
                title: getWeekLabel(weekRange, currentWeek),
                range: `${formatDateShort(weekRange.start)} — ${formatDateShort(weekRange.end)}`,
                events: [],
            });
        }

        monthGroup.weeks.get(weekKey).events.push(evento);
    });

    return Array.from(groups.values());
}

function renderAgendaModal(events, referenceDate) {
    if (!agendaModalContent) return;

    agendaModalContent.innerHTML = "";

    if (!events.length) {
        const empty = document.createElement("p");

        empty.className = "agenda-modal__empty";
        empty.textContent = "Nenhum evento atual ou futuro cadastrado.";
        agendaModalContent.appendChild(empty);
        return;
    }

    groupEventsForModal(events, referenceDate).forEach((monthGroup) => {
        const month = document.createElement("section");
        const title = document.createElement("h4");

        month.className = "agenda-modal__month";
        title.textContent = monthGroup.title;
        month.appendChild(title);

        Array.from(monthGroup.weeks.values()).forEach((weekGroup) => {
            const week = document.createElement("div");
            const weekTitle = document.createElement("div");
            const weekName = document.createElement("strong");
            const weekRange = document.createElement("span");
            const eventList = document.createElement("div");

            week.className = "agenda-modal__week";
            weekTitle.className = "agenda-modal__week-title";
            weekName.textContent = weekGroup.title;
            weekRange.textContent = weekGroup.range;
            eventList.className = "agenda-modal__events";

            weekTitle.append(weekName, weekRange);

            weekGroup.events.forEach((evento) => {
                eventList.appendChild(
                    createEventCard(
                        evento,
                        getEventStatus(evento, referenceDate),
                        true,
                    ),
                );
            });

            week.append(weekTitle, eventList);
            month.appendChild(week);
        });

        agendaModalContent.appendChild(month);
    });
}

function lockAgendaModalScroll() {
    const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

    agendaModalLockedScrollY = window.scrollY;
    window.__suspendHeaderVisibility = true;

    document.body.style.setProperty(
        "--agenda-modal-locked-scroll-y",
        `${agendaModalLockedScrollY}px`,
    );
    document.body.style.setProperty(
        "--agenda-modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.body.style.setProperty(
        "--active-modal-page-scrollbar-width",
        `${Math.max(scrollbarWidth, 0)}px`,
    );
    document.documentElement.classList.add("modal-scroll-locked");
    document.body.classList.add("agenda-modal-open");
    window.addEventListener("wheel", preventAgendaModalPageScroll, {
        passive: false,
    });
    window.addEventListener("touchmove", preventAgendaModalPageScroll, {
        passive: false,
    });
    window.addEventListener("touchstart", storeAgendaModalTouchStart, {
        passive: true,
    });
    window.addEventListener("scroll", keepAgendaPageScrollLocked, {
        passive: true,
    });
    window.addEventListener("pointerdown", closeAgendaModalFromPageChrome, {
        capture: true,
    });
}

function getLocalAgendaEvents() {
    if (!Array.isArray(window.agendaEventos)) {
        return [];
    }

    return window.agendaEventos;
}

async function obterAgendaDados() {
    return getLocalAgendaEvents();
}

async function carregarAgenda() {
    const eventos = await obterAgendaDados();

    agendaEventos = sortEvents(eventos.map(normalizeEvent));

    return agendaEventos;
}

function renderAgendaView(events, referenceDate = new Date(), highlightedIds = new Set()) {
    const weekRange = getWeekRange(referenceDate);
    const weekEvents = events.filter((evento) => {
        return isEventInRange(evento, weekRange.start, weekRange.end);
    });
    const homeEvents = weekEvents.slice(0, AGENDA_HOME_EVENT_LIMIT);

    renderWeekRange(weekRange);
    renderHomeTimeline(homeEvents, referenceDate, highlightedIds);
    renderRemainingWeekEvents(weekEvents.length);

    if (highlightedIds.size) {
        setTimeout(clearAgendaUpdatedHighlights, AGENDA_HIGHLIGHT_CLEAR_DELAY);
    }
}

function applyAgendaEventVersion(events, signatures, highlightedIds = new Set()) {
    const scrollY = window.scrollY;

    agendaEventos = events;
    agendaEventSignatures = signatures;

    renderAgendaView(agendaEventos, new Date(), highlightedIds);
    window.scrollTo(0, scrollY);
}

function applyPendingAgendaEvents() {
    if (!agendaEventosPendentes) return;

    const pendingEvents = agendaEventosPendentes.events;
    const pendingSignatures = agendaEventosPendentes.signatures;
    const pendingChangedIds = agendaEventosPendentes.changedIds;
    const scrollY = window.scrollY;

    agendaEventosPendentes = null;
    closeAgendaUpdateNotification();
    applyAgendaEventVersion(pendingEvents, pendingSignatures, pendingChangedIds);
    window.scrollTo(0, scrollY);
}

async function consultarAtualizacaoSilenciosaAgenda() {
    if (agendaSilentUpdateInProgress) return false;

    agendaSilentUpdateInProgress = true;

    try {
        const eventos = await obterAgendaDados();
        const nextEvents = sortEvents(eventos.map(normalizeEvent));
        const nextSignatures = createAgendaSignatureMap(nextEvents);

        if (!hasAgendaChanged(agendaEventSignatures, nextSignatures)) {
            return false;
        }

        const changedIds = getChangedAgendaEventIds(
            agendaEventSignatures,
            nextSignatures,
        );

        if (isAgendaModalOpen()) {
            agendaEventosPendentes = {
                events: nextEvents,
                signatures: nextSignatures,
                changedIds,
            };

            showAgendaUpdateNotification({
                message: "Feche esta janela para visualizar as alterações.",
                showAction: false,
            });

            return true;
        }

        if (isAgendaSectionVisible()) {
            renderAgendaState("Atualizando agenda...", "updating");

            requestAnimationFrame(() => {
                applyAgendaEventVersion(nextEvents, nextSignatures, changedIds);
            });

            return true;
        }

        applyAgendaEventVersion(nextEvents, nextSignatures, changedIds);
        showAgendaUpdateNotification({
            showAction: true,
        });

        return true;
    } catch (error) {
        if (!agendaEventos.length) {
            renderAgendaError();
        }

        return false;
    } finally {
        agendaSilentUpdateInProgress = false;
    }
}

function startAgendaSilentPolling() {
    if (!AGENDA_SILENT_POLLING_ENABLED) return;

    setInterval(() => {
        consultarAtualizacaoSilenciosaAgenda();
    }, AGENDA_SILENT_POLL_INTERVAL);
}

function isAgendaUpdateNotificationBusy() {
    return Boolean(
        agendaUpdateNotification &&
            !agendaUpdateNotification.hidden &&
            (agendaUpdateNotification.classList.contains("is-visible") ||
                agendaUpdateNotification.classList.contains("is-hiding") ||
                agendaUpdateNotification.classList.contains("is-dragging") ||
                agendaUpdateNotification.classList.contains("is-swipe-returning") ||
                agendaUpdateNotification.classList.contains("is-swipe-dismissing")),
    );
}

function showAgendaUpdateNotificationTest() {
    if (isAgendaUpdateNotificationBusy()) return;

    showAgendaUpdateNotification({
        message: isAgendaModalOpen()
            ? "Feche esta janela para visualizar as alterações."
            : "",
        showAction: !isAgendaModalOpen(),
    });
}

function startAgendaUpdateNotificationTest() {
    if (!AGENDA_UPDATE_NOTIFICATION_TEST_ENABLED) return;

    setInterval(() => {
        showAgendaUpdateNotificationTest();
    }, AGENDA_UPDATE_NOTIFICATION_TEST_INTERVAL);
}

function unlockAgendaModalScroll() {
    const scrollY = agendaModalLockedScrollY;

    document.body.classList.remove("agenda-modal-open");
    document.documentElement.classList.remove("modal-scroll-locked");
    document.body.style.removeProperty("--agenda-modal-locked-scroll-y");
    document.body.style.removeProperty("--agenda-modal-page-scrollbar-width");
    document.body.style.removeProperty("--active-modal-page-scrollbar-width");
    window.removeEventListener("wheel", preventAgendaModalPageScroll);
    window.removeEventListener("touchmove", preventAgendaModalPageScroll);
    window.removeEventListener("touchstart", storeAgendaModalTouchStart);
    window.removeEventListener("scroll", keepAgendaPageScrollLocked);
    window.removeEventListener("pointerdown", closeAgendaModalFromPageChrome, {
        capture: true,
    });
    agendaModalTouchLastY = null;

    window.scrollTo(0, scrollY);

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);

        requestAnimationFrame(() => {
            window.__suspendHeaderVisibility = false;
        });
    });
}

function getScrollableAgendaModalElement(target, modalDialog) {
    if (!(target instanceof Element) || !modalDialog?.contains(target)) {
        return null;
    }

    let currentElement = target;

    while (currentElement && modalDialog.contains(currentElement)) {
        const { overflowY } = getComputedStyle(currentElement);
        const canScrollY =
            /(auto|scroll)/.test(overflowY) &&
            currentElement.scrollHeight > currentElement.clientHeight;

        if (canScrollY) return currentElement;

        if (currentElement === modalDialog) break;

        currentElement = currentElement.parentElement;
    }

    return null;
}

function preventAgendaModalPageScroll(event) {
    if (!agendaModal?.classList.contains("active")) return;

    const scrollableElement = getScrollableAgendaModalElement(
        event.target,
        agendaModal,
    );

    if (scrollableElement && canContinueAgendaModalScroll(event, scrollableElement)) {
        return;
    }

    event.preventDefault();
}

function storeAgendaModalTouchStart(event) {
    agendaModalTouchLastY = event.touches?.[0]?.clientY ?? null;
}

function keepAgendaPageScrollLocked() {
    if (!document.body.classList.contains("agenda-modal-open")) return;
    if (window.scrollY === agendaModalLockedScrollY) return;

    window.scrollTo(0, agendaModalLockedScrollY);
}

function closeAgendaModalFromPageChrome(event) {
    if (!agendaModal?.classList.contains("active")) return;
    if (event.target.closest?.(".agenda-update-notification")) return;
    if (agendaModal?.contains(event.target)) return;

    closeAgendaModal();
}

function canContinueAgendaModalScroll(event, scrollableElement) {
    let deltaY = 0;

    if (event.type === "wheel") {
        deltaY = event.deltaY;
    } else if (event.type === "touchmove") {
        const currentY = event.touches?.[0]?.clientY;

        if (typeof currentY !== "number" || agendaModalTouchLastY === null) {
            agendaModalTouchLastY = currentY ?? null;
            return true;
        }

        deltaY = agendaModalTouchLastY - currentY;
        agendaModalTouchLastY = currentY;
    }

    if (deltaY < 0) return scrollableElement.scrollTop > 0;

    if (deltaY > 0) {
        return (
            scrollableElement.scrollTop + scrollableElement.clientHeight <
            scrollableElement.scrollHeight - 1
        );
    }

    return true;
}

function openAgendaModal() {
    if (!agendaModal || !agendaModalOverlay) return;

    agendaModalLastFocusedElement = document.activeElement;
    renderAgendaModal(getVisibleModalEvents(), new Date());
    lockAgendaModalScroll();

    agendaModal.hidden = false;
    agendaModalOverlay.hidden = false;
    agendaModal.setAttribute("aria-hidden", "false");
    agendaModalOverlay.setAttribute("aria-hidden", "false");

    requestAnimationFrame(() => {
        agendaModal.classList.add("active");
        agendaModalOverlay.classList.add("active");
        agendaModal.focus();
    });
}

function closeAgendaModal() {
    if (!agendaModal?.classList.contains("active")) return;

    agendaModal.classList.remove("active");
    agendaModalOverlay?.classList.remove("active");
    agendaModal.setAttribute("aria-hidden", "true");
    agendaModalOverlay?.setAttribute("aria-hidden", "true");
    unlockAgendaModalScroll();

    setTimeout(() => {
        agendaModal.hidden = true;

        if (agendaModalOverlay) {
            agendaModalOverlay.hidden = true;
        }

        if (
            agendaModalLastFocusedElement &&
            document.contains(agendaModalLastFocusedElement)
        ) {
            agendaModalLastFocusedElement.focus({ preventScroll: true });
        }

        applyPendingAgendaEvents();
    }, AGENDA_MODAL_CLOSE_TRANSITION_DELAY);
}

function getAgendaFocusableElements() {
    return Array.from(
        agendaModal.querySelectorAll(
            "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])",
        ),
    ).filter((element) => !element.hidden);
}

function getVisibleModalEvents(referenceDate = new Date()) {
    const currentWeek = getWeekRange(referenceDate);

    return agendaEventos.filter((evento) => {
        return evento.endDate >= currentWeek.start;
    });
}

async function renderAgenda() {
    if (!agendaSection) return;

    const referenceDate = new Date();
    const weekRange = getWeekRange(referenceDate);
    let normalizedEvents = [];

    renderWeekRange(weekRange);
    renderAgendaLoading();
    renderRemainingWeekEvents(0);

    try {
        normalizedEvents = await carregarAgenda();
    } catch (error) {
        renderAgendaError();
        renderRemainingWeekEvents(0);
        return;
    }

    agendaEventSignatures = createAgendaSignatureMap(normalizedEvents);
    renderAgendaView(normalizedEvents, referenceDate);
}

agendaOpenButton?.addEventListener("click", openAgendaModal);
agendaModalClose?.addEventListener("click", closeAgendaModal);
agendaModalOverlay?.addEventListener("click", closeAgendaModal);

agendaModal?.addEventListener("click", (event) => {
    if (agendaModalDialog?.contains(event.target)) return;

    closeAgendaModal();
});

document.addEventListener("keydown", (event) => {
    if (!agendaModal?.classList.contains("active")) return;

    if (event.key === "Escape") {
        closeAgendaModal();
        return;
    }

    if (event.key !== "Tab") return;

    const focusableElements = getAgendaFocusableElements();

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

renderAgenda();
startAgendaSilentPolling();
startAgendaUpdateNotificationTest();
