<?php
/**
 * Cleanup expired auth tokens. Intended to be run from cron.
 * Example cron (daily):
 * 0 3 * * * php /home/yourcpuser/public_html/api/cleanup_tokens.php >/dev/null 2>&1
 */
require_once __DIR__ . '/db.php';

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE expires_at <= NOW()');
    $stmt->execute();
    echo "OK\n";
} catch (Throwable $e) {
    fwrite(STDERR, "ERROR: " . $e->getMessage() . "\n");
    http_response_code(500);
}
