<?php
// CORS handling: allow known frontend origins and fall back to safe defaults.
// Notes:
// - Do NOT return Access-Control-Allow-Origin: * together with Allow-Credentials: true.
// - Update $allowed array with your production frontend origins.

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    // add your production frontends here, e.g. 'https://example.com'
];

if ($origin && in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
} else {
    // For unknown origin, allow simple GET access (no credentials) to be safe in production.
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: false');
}

header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Preflight
    http_response_code(204);
    exit;
}
