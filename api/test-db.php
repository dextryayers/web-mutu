<?php
/**
 * Simple DB test endpoint. Returns a small JSON confirming DB connectivity.
 * Usage: GET /api/test-db.php
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/cors.php';

try {
    $pdo = get_pdo();
    $stmt = $pdo->query('SELECT 1 AS ok');
    $row = $stmt->fetch();
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'db' => $row]);
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
