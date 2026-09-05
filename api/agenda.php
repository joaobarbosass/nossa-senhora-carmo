<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/*
 * Endpoint reservado para a futura integracao com Google Calendar.
 *
 * Fluxo planejado:
 * 1. carregar config/google-calendar.php;
 * 2. consultar a Google Calendar API em modo somente leitura;
 * 3. normalizar os eventos para o formato interno do site;
 * 4. devolver JSON para o frontend.
 *
 * Ainda nao ha API Key, Calendar ID real ou chamada externa configurada.
 * Nao exponha credenciais, stack traces ou caminhos internos neste endpoint.
 */

http_response_code(200);

echo json_encode(
    [
        'status' => 'not_configured',
        'events' => [],
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
);
