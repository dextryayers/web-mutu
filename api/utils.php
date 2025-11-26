<?php
function read_json(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        // If the client sent data but it's invalid JSON, return 400
        respond(['error' => 'invalid JSON payload'], 400);
    }
    return $data;
}

function respond($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function require_id(): int {
    $id = $_GET['id'] ?? null;
    if (!$id) respond(['error' => 'id required'], 400);
    return (int) $id;
}

function request_method(): string {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $method = strtoupper($method);
    if ($method === 'POST') {
        $override = $_POST['_method'] ?? $_GET['_method'] ?? null;
        if ($override) return strtoupper($override);
        $hdr = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;
        if ($hdr) return strtoupper($hdr);
    }
    return $method;
}

function bearer_token(): ?string {
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['Authorization'] ?? '');
    if (!$hdr) return null;
    if (stripos($hdr, 'Bearer ') === 0) return substr($hdr, 7);
    return null;
}

function auth_user_id(): ?int {
    if (!function_exists('get_pdo')) return null;
    $token = bearer_token();
    if (!$token) return null;
    try {
        $pdo = get_pdo();
        $stmt = $pdo->prepare('SELECT user_id FROM auth_tokens WHERE token=? AND expires_at > NOW()');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row) return null;
        return (int)$row['user_id'];
    } catch (Throwable $e) {
        return null;
    }
}

function require_auth(): int {
    $uid = auth_user_id();
    if (!$uid) respond(['error' => 'unauthorized'], 401);
    return $uid;
}

function auth_user_role(): ?string {
    $uid = auth_user_id();
    if (!$uid) return null;
    try {
        $pdo = get_pdo();
        $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
        $stmt->execute([$uid]);
        $row = $stmt->fetch();
        if (!$row) return null;
        return $row['role'];
    } catch (Throwable $e) {
        return null;
    }
}

function require_admin(): int {
    $uid = require_auth();
    $role = auth_user_role();
    if ($role !== 'admin') respond(['error' => 'forbidden'], 403);
    return $uid;
}

function verify_recaptcha(?string $token, string $action = 'general'): void {
    $secret = getenv('RECAPTCHA_SECRET');
    if (!$secret) {
        // if not configured, allow (to avoid blocking dev)
        return;
    }
    // Only require token if reCAPTCHA is configured
    if (!$token) {
        respond(['error' => 'recaptcha token missing'], 400);
    }
    $payload = http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5,
    ]);
    $res = curl_exec($ch);
    if ($res === false) {
        respond(['error' => 'recaptcha verification failed'], 400);
    }
    $data = json_decode($res, true) ?: [];
    if (empty($data['success'])) {
        respond(['error' => 'recaptcha rejected'], 400);
    }
    if (isset($data['action']) && $data['action'] !== $action) {
        respond(['error' => 'recaptcha action mismatch'], 400);
    }
    if (isset($data['score']) && $data['score'] < 0.5) {
        respond(['error' => 'recaptcha score too low'], 400);
    }
}
