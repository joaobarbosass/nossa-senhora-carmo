<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

/*
 * Endpoint reservado para a futura integracao com Google Calendar.
 *
 * O cache e o fallback da agenda devem ficar exclusivamente neste backend.
 * O frontend deve apenas consumir a resposta pronta deste endpoint.
 *
 * Fluxo planejado:
 * 1. carregar config/google-calendar.php;
 * 2. verificar se existe cache valido em cache/agenda.json;
 * 3. decidir se precisa consultar Google Calendar;
 * 4. consultar a Google Calendar API em modo somente leitura;
 * 5. se o Google responder corretamente:
 *    - normalizar os eventos para o formato interno do site;
 *    - atualizar cache/agenda.json com a ultima resposta valida;
 *    - retornar status "ok", cached false e os eventos novos;
 * 6. se o Google falhar:
 *    - manter o cache anterior intacto;
 *    - retornar o ultimo cache valido com status "ok" e cached true;
 * 7. se o Google falhar e nao houver cache valido:
 *    - retornar status "error", events [], cached false e updatedAt null.
 *
 * Um cache valido nunca deve ser sobrescrito por uma resposta de erro.
 *
 * Contrato futuro de resposta:
 * {
 *   "status": "ok|error|not_configured",
 *   "events": [],
 *   "cached": false,
 *   "updatedAt": null
 * }
 *
 * Futuramente, caso exista cache valido em cache/agenda.json, ele podera ser
 * usado como fallback seguro. Ainda nao ha API Key, Calendar ID real, cache
 * ativo ou chamada externa configurada.
 *
 * Nao exponha credenciais, stack traces ou caminhos internos neste endpoint.
 */

http_response_code(200);

echo json_encode(
    [
        'status' => 'not_configured',
        'events' => [],
        'cached' => false,
        'updatedAt' => null,
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
);
