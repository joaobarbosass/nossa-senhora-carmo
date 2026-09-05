window.agendaEventos = [
    // =========================
    // EVENTOS ANTIGOS
    // =========================

    {
        id: "evento-teste-2026-08-20",
        titulo: "Encontro de Catequistas",
        dataInicio: "2026-08-20",
        horaInicio: "19:00",
        dataFim: "2026-08-20",
        horaFim: "21:00",
        local: "Sala de Reuniões",
        descricao: "Evento fictício antigo para testar filtro de semanas passadas.",
    },

    {
        id: "evento-teste-2026-08-27",
        titulo: "Reunião de Equipe",
        dataInicio: "2026-08-27",
        horaInicio: "19:30",
        dataFim: "2026-08-27",
        horaFim: "20:30",
        local: "Centro Pastoral",
        descricao: "Evento fictício antigo que não deve aparecer na Home nem no modal.",
    },

    // =========================
    // SEMANA ATUAL
    // 31/08/2026 - 06/09/2026
    // =========================

    {
        id: "evento-teste-2026-08-31",
        titulo: "Encontro de Pastoral",
        dataInicio: "2026-08-31",
        horaInicio: "19:30",
        dataFim: "2026-08-31",
        horaFim: "21:00",
        local: "Igreja Matriz",
        descricao: "Evento fictício realizado nesta semana.",
    },

    {
        id: "evento-teste-2026-09-02",
        titulo: "Grupo de Oração",
        dataInicio: "2026-09-02",
        horaInicio: "19:00",
        dataFim: "2026-09-02",
        horaFim: "20:30",
        local: "Igreja Menino Jesus",
        descricao: "Evento fictício realizado nesta semana.",
    },

    {
        id: "evento-teste-2026-09-05-manha",
        titulo: "Oficina de Liturgia",
        dataInicio: "2026-09-05",
        horaInicio: "09:00",
        dataFim: "2026-09-05",
        horaFim: "10:30",
        local: "Salão Paroquial",
        descricao: "Evento fictício de hoje já encerrado para testar Realizado pelo horário.",
    },

    {
        id: "evento-teste-2026-09-05-tarde",
        titulo: "Momento de Oração",
        dataInicio: "2026-09-05",
        horaInicio: "15:00",
        dataFim: "2026-09-05",
        horaFim: "23:00",
        local: "Capela da Ressurreição",
        descricao: "Evento fictício de hoje com término tarde para testar o destaque Hoje.",
    },

    {
        id: "evento-teste-2026-09-05-noite",
        titulo: "Encontro de Jovens",
        dataInicio: "2026-09-05",
        horaInicio: "19:00",
        dataFim: "2026-09-05",
        horaFim: "21:00",
        local: "Centro Pastoral",
        descricao: "Evento fictício de hoje para validar a ordenação cronológica.",
    },

    {
        id: "evento-teste-2026-09-05-06",
        titulo: "Formação Paroquial",
        dataInicio: "2026-09-05",
        horaInicio: "18:00",
        dataFim: "2026-09-06",
        horaFim: "12:00",
        local: "Salão Paroquial",
        descricao: "Evento fictício de vários dias para testar intervalo e status automático.",
    },

    {
        id: "evento-teste-2026-09-06-manha",
        titulo: "Reunião de Coordenação",
        dataInicio: "2026-09-06",
        horaInicio: "09:00",
        dataFim: "2026-09-06",
        horaFim: "10:00",
        local: "Sala de Reuniões",
        descricao: "Evento fictício de amanhã para testar a label Amanhã.",
    },

    {
        id: "evento-teste-2026-09-06-tarde",
        titulo: "Encontro de Pastoral",
        dataInicio: "2026-09-06",
        horaInicio: "15:00",
        dataFim: "2026-09-06",
        horaFim: "17:00",
        local: "Igreja Matriz",
        descricao: "Evento fictício de amanhã para validar contador de eventos restantes.",
    },

    // =========================
    // EVENTOS FUTUROS
    // =========================

    {
        id: "evento-teste-2026-09-10",
        titulo: "Formação para Ministros",
        dataInicio: "2026-09-10",
        horaInicio: "19:30",
        dataFim: "2026-09-10",
        horaFim: "21:30",
        local: "Salão Paroquial",
        descricao: "Evento fictício da próxima semana para testar o agrupamento do modal.",
    },

    {
        id: "evento-teste-2026-09-19",
        titulo: "Reunião de Equipe",
        dataInicio: "2026-09-19",
        horaInicio: "16:00",
        dataFim: "2026-09-19",
        horaFim: "18:00",
        local: "Centro Pastoral",
        descricao: "Evento fictício algumas semanas à frente para testar ordenação futura.",
    },

    {
        id: "evento-teste-2026-10-03",
        titulo: "Retiro Paroquial",
        dataInicio: "2026-10-03",
        horaInicio: "08:00",
        dataFim: "2026-10-04",
        horaFim: "17:00",
        local: "Centro Pastoral",
        descricao: "Evento fictício de outro mês para validar agrupamento mensal no modal.",
    },
];
