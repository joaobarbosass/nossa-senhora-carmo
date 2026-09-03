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

const agendaEventos = window.agendaEventos || [];
const AGENDA_HOME_EVENT_LIMIT = 5;
const AGENDA_MODAL_CLOSE_TRANSITION_DELAY = 240;

let agendaModalLastFocusedElement = null;
let agendaModalLockedScrollY = 0;

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
    const isToday =
        evento.startDate <= todayEnd && evento.endDate >= todayStart;
    const isPast = evento.endDate < referenceDate;

    if (isPast) return "past";
    if (isToday) return "today";

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

    if (status === "today" || status === "past") {
        const statusLabel = document.createElement("span");

        statusLabel.className = "agenda-event__status";
        statusLabel.textContent = status === "today" ? "Hoje" : "Realizado";
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

function renderHomeTimeline(events, referenceDate) {
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
        marker.className = "parish-agenda__timeline-marker";

        item.append(marker, createEventCard(evento, status));
        agendaTimeline.appendChild(item);
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
    document.body.classList.add("agenda-modal-open");
}

function unlockAgendaModalScroll() {
    const scrollY = agendaModalLockedScrollY;

    document.body.classList.remove("agenda-modal-open");
    document.body.style.removeProperty("--agenda-modal-locked-scroll-y");
    document.body.style.removeProperty("--agenda-modal-page-scrollbar-width");

    window.scrollTo(0, scrollY);

    requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);

        requestAnimationFrame(() => {
            window.__suspendHeaderVisibility = false;
        });
    });
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

    setTimeout(() => {
        agendaModal.hidden = true;

        if (agendaModalOverlay) {
            agendaModalOverlay.hidden = true;
        }

        unlockAgendaModalScroll();

        if (
            agendaModalLastFocusedElement &&
            document.contains(agendaModalLastFocusedElement)
        ) {
            agendaModalLastFocusedElement.focus({ preventScroll: true });
        }
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
    const normalizedEvents = sortEvents(agendaEventos.map(normalizeEvent));
    const currentWeek = getWeekRange(referenceDate);

    return normalizedEvents.filter((evento) => {
        return evento.endDate >= currentWeek.start;
    });
}

function renderAgenda() {
    if (!agendaSection) return;

    const referenceDate = new Date();
    const weekRange = getWeekRange(referenceDate);
    const normalizedEvents = sortEvents(agendaEventos.map(normalizeEvent));
    const weekEvents = normalizedEvents.filter((evento) => {
        return isEventInRange(evento, weekRange.start, weekRange.end);
    });
    const homeEvents = weekEvents.slice(0, AGENDA_HOME_EVENT_LIMIT);

    renderWeekRange(weekRange);
    renderHomeTimeline(homeEvents, referenceDate);
    renderRemainingWeekEvents(weekEvents.length);
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
