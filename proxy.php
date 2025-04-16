<?php
/**
 * Arquivo de proxy para redirecionar requisições para o backend Node.js
 */

// Configurações
$backend_url = "http://localhost:3000"; // Substitua pelo URL do seu backend Node.js
$timeout = 30; // Timeout em segundos

// Função para fazer proxy da requisição
function proxy_request($endpoint) {
    global $backend_url, $timeout;
    
    // Obtém o método da requisição
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Configura o contexto da requisição
    $options = [
        'http' => [
            'method' => $method,
            'header' => [
                'Content-Type: application/json',
                'User-Agent: PHP Proxy'
            ],
            'timeout' => $timeout
        ]
    ];
    
    // Adiciona o corpo da requisição para métodos POST, PUT, etc.
    if ($method === 'POST' || $method === 'PUT') {
        $input = file_get_contents('php://input');
        $options['http']['content'] = $input;
    }
    
    // Cria o contexto
    $context = stream_context_create($options);
    
    // Faz a requisição para o backend
    $target_url = $backend_url . $endpoint;
    $response = @file_get_contents($target_url, false, $context);
    
    // Obtém os headers da resposta
    $response_headers = $http_response_header ?? [];
    
    // Processa os headers da resposta
    foreach ($response_headers as $header) {
        if (strpos($header, 'HTTP/') === 0) {
            // Extrai o código de status
            preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches);
            $status_code = $matches[1] ?? 200;
            http_response_code((int)$status_code);
        } else if (strpos($header, 'Content-Type:') === 0) {
            // Envia o header Content-Type
            header($header);
        }
    }
    
    // Adiciona headers CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    
    // Retorna a resposta
    return $response;
}

// Obtém o endpoint da URL
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove o prefixo /api/ para obter o endpoint
$endpoint_parts = explode('/api/', $path, 2);
if (count($endpoint_parts) > 1) {
    $endpoint = '/api/' . $endpoint_parts[1];
    
    // Faz o proxy da requisição
    $response = proxy_request($endpoint);
    
    // Verifica se a resposta foi bem-sucedida
    if ($response !== false) {
        echo $response;
    } else {
        // Erro na requisição
        http_response_code(502);
        echo json_encode(['error' => 'Não foi possível conectar ao servidor backend']);
    }
} else {
    // Endpoint inválido
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint não encontrado']);
}