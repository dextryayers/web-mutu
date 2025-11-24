<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$pdo = get_pdo();
$method = request_method();
$action = $_GET['action'] ?? '';


if ($method === 'POST' && $action === 'register') {
    $data = read_json();
    verify_recaptcha($data['recaptchaToken'] ?? null, 'register');
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $role = $data['role'] ?? 'member';
    $nik = isset($data['nik']) ? trim($data['nik']) : null;
    $fullName = isset($data['fullName']) ? trim($data['fullName']) : null;
    $city = isset($data['city']) ? trim($data['city']) : null;
    $instansi = isset($data['instansi']) ? trim($data['instansi']) : null;
    
    if (!in_array($role, ['admin', 'member'], true)) {
        $role = 'member';
    }
    
    if ($fullName === null || $fullName === '') {
        respond(['error' => 'fullName required'], 400);
    }
    
    if ($role === 'admin') {
        if ($nik === null || $nik === '') {
            respond(['error' => 'nik required for admin'], 400);
        }
        if (!preg_match('/^\d{8,20}$/', $nik)) {
            respond(['error' => 'nik must be 8-20 digits'], 422);
        }
        if ($city === null || $city === '') {
            respond(['error' => 'city required for admin'], 400);
        }
        if ($instansi === null || $instansi === '') {
            respond(['error' => 'instansi required for admin'], 400);
        }
        if (!in_array($instansi, ['Dinkes Kabupaten', 'Dinkes Kota'], true)) {
            respond(['error' => 'instansi must be Dinkes Kabupaten or Dinkes Kota'], 422);
        }
    } else {
        $nik = null;
        $city = null;
        $instansi = null;
    }
    
    if ($username === '' || $password === '' || $email === '' || $phone === '') respond(['error' => 'username, email, phone and password required'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'invalid email'], 422);
    if (!preg_match('/^[A-Za-z0-9._-]{3,32}$/', $username)) {
        respond(['error' => 'username must be 3-32 chars: letters, numbers, dot, underscore, dash'], 422);
    }
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
        respond(['error' => 'password must be at least 8 chars, include upper, lower, and number'], 422);
    }
    // ensure unique username and email
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username=? OR email=?');
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) respond(['error' => 'username or email exists'], 409);
    if ($nik !== null) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE nik = ?');
        $stmt->execute([$nik]);
        if ($stmt->fetch()) respond(['error' => 'nik exists'], 409);
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, email, phone, nik, full_name, city, instansi, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$username, $hash, $email, $phone, $nik, $fullName, $city, $instansi, $role]);
    respond(['registered' => true], 201);
}

if ($method === 'POST' && $action === 'login') {
    $data = read_json();
    verify_recaptcha($data['recaptchaToken'] ?? null, 'login');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    if ($email === '' || $password === '') respond(['error' => 'email and password required'], 400);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'invalid email format'], 422);
    $stmt = $pdo->prepare('SELECT id, password_hash, username, role, email, phone, nik, full_name, city, instansi FROM users WHERE email=?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        respond(['error' => 'invalid credentials'], 401);
    }
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + 60*60*24*30);
    $stmt = $pdo->prepare('INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?,?,?)');
    $stmt->execute([$token, (int)$row['id'], $expires]);
    respond(['token' => $token, 'user' => [
        'id' => (int)$row['id'], 
        'username' => $row['username'], 
        'role' => $row['role'], 
        'email' => $row['email'], 
        'phone' => $row['phone'], 
        'nik' => $row['nik'],
        'full_name' => $row['full_name'],
        'city' => $row['city'],
        'instansi' => $row['instansi']
    ]]);
}

// Update profile (email, phone, optional password)
if ($method === 'PUT' && $action === 'profile') {
    $uid = require_auth();
    $data = read_json();
    $email = isset($data['email']) ? trim($data['email']) : null;
    $phone = isset($data['phone']) ? trim($data['phone']) : null;
    $password = $data['password'] ?? null;

    if ($email === null && $phone === null && $password === null) {
        respond(['error' => 'nothing to update'], 400);
    }

    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['error' => 'invalid email'], 422);
    }

    // ensure email unique (if provided)
    if ($email !== null) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
        $stmt->execute([$email, $uid]);
        if ($stmt->fetch()) {
            respond(['error' => 'email exists'], 409);
        }
    }

    $fields = [];
    $params = [];
    if ($email !== null) {
        $fields[] = 'email = ?';
        $params[] = $email;
    }
    if ($phone !== null) {
        $fields[] = 'phone = ?';
        $params[] = $phone;
    }
    if ($password !== null && $password !== '') {
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
            respond(['error' => 'password must be at least 8 chars, include upper, lower, and number'], 422);
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $fields[] = 'password_hash = ?';
        $params[] = $hash;
    }

    if ($fields) {
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $uid;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    // return fresh user data
    $stmt = $pdo->prepare('SELECT id, username, role, email, phone, nik FROM users WHERE id = ?');
    $stmt->execute([$uid]);
    $row = $stmt->fetch();
    respond([
        'id' => (int)$row['id'],
        'username' => $row['username'],
        'role' => $row['role'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'nik' => $row['nik'],
    ]);
}

// Admin: create admin user
if ($method === 'POST' && $action === 'create-admin') {
    require_admin();
    $data = read_json();
    verify_recaptcha($data['recaptchaToken'] ?? null, 'create_admin');
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $nik = isset($data['nik']) ? trim($data['nik']) : '';
    $fullName = isset($data['fullName']) ? trim($data['fullName']) : '';
    $city = isset($data['city']) ? trim($data['city']) : '';
    $instansi = isset($data['instansi']) ? trim($data['instansi']) : '';
    $role = 'admin';
    if ($username === '' || $password === '' || $email === '' || $phone === '' || $nik === '' || $fullName === '' || $city === '' || $instansi === '') respond(['error' => 'username, email, phone, nik, fullName, city, instansi and password required'], 400);
    if (!preg_match('/^\d{8,20}$/', $nik)) respond(['error' => 'nik must be 8-20 digits'], 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'invalid email'], 422);
    if (!preg_match('/^[A-Za-z0-9._-]{3,32}$/', $username)) {
        respond(['error' => 'username must be 3-32 chars: letters, numbers, dot, underscore, dash'], 422);
    }
    if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
        respond(['error' => 'password must be at least 8 chars, include upper, lower, and number'], 422);
    }
    if (!in_array($instansi, ['Dinkes Kabupaten', 'Dinkes Kota'], true)) {
        respond(['error' => 'instansi must be Dinkes Kabupaten or Dinkes Kota'], 422);
    }
    // ensure unique username and email
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username=? OR email=?');
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) respond(['error' => 'username or email exists'], 409);
    $stmt = $pdo->prepare('SELECT id FROM users WHERE nik = ?');
    $stmt->execute([$nik]);
    if ($stmt->fetch()) respond(['error' => 'nik exists'], 409);
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, email, phone, nik, full_name, city, instansi, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$username, $hash, $email, $phone, $nik, $fullName, $city, $instansi, $role]);
    respond(['created' => true], 201);
}

if ($method === 'POST' && $action === 'logout') {
    $token = bearer_token();
    if ($token) {
        $stmt = $pdo->prepare('DELETE FROM auth_tokens WHERE token=?');
        $stmt->execute([$token]);
    }
    respond(['ok' => true]);
}

if ($method === 'GET' && $action === 'me') {
    $token = bearer_token();
    if (!$token) respond(['error' => 'unauthorized'], 401);
    $stmt = $pdo->prepare('SELECT u.id, u.username, u.role, u.email, u.phone, u.nik FROM auth_tokens t JOIN users u ON u.id=t.user_id WHERE t.token=? AND t.expires_at > NOW()');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    if (!$row) respond(['error' => 'unauthorized'], 401);
    respond(['id' => (int)$row['id'], 'username' => $row['username'], 'role' => $row['role'], 'email' => $row['email'], 'phone' => $row['phone'], 'nik' => $row['nik']]);
}

// Admin: list users
if ($method === 'GET' && $action === 'users') {
    // only admin can list
    require_admin();
    $stmt = $pdo->query('SELECT id, username, email, phone, nik, role, created_at FROM users ORDER BY id DESC');
    $rows = $stmt->fetchAll();
    respond($rows);
}

// Admin: delete user
if ($method === 'DELETE' && $action === 'users') {
    require_admin();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) respond(['error' => 'id required'], 400);
    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    respond(['deleted' => true]);
}

// Admin: update user
if ($method === 'PUT' && $action === 'users') {
    require_admin();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) respond(['error' => 'id required'], 400);
    $data = read_json();
    $email = isset($data['email']) ? trim($data['email']) : null;
    $phone = isset($data['phone']) ? trim($data['phone']) : null;
    $role = isset($data['role']) ? $data['role'] : null;
    $password = $data['password'] ?? null;

    if ($email === null && $phone === null && $role === null && $password === null) {
        respond(['error' => 'nothing to update'], 400);
    }

    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['error' => 'invalid email'], 422);
    }

    if ($email !== null) {
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id <> ?');
        $stmt->execute([$email, $id]);
        if ($stmt->fetch()) {
            respond(['error' => 'email exists'], 409);
        }
    }

    if ($role !== null && !in_array($role, ['admin', 'member'], true)) {
        respond(['error' => 'invalid role'], 422);
    }

    $fields = [];
    $params = [];
    if ($email !== null) {
        $fields[] = 'email = ?';
        $params[] = $email;
    }
    if ($phone !== null) {
        $fields[] = 'phone = ?';
        $params[] = $phone;
    }
    if ($role !== null) {
        $fields[] = 'role = ?';
        $params[] = $role;
    }
    if ($password !== null && $password !== '') {
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/', $password)) {
            respond(['error' => 'password must be at least 8 chars, include upper, lower, and number'], 422);
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $fields[] = 'password_hash = ?';
        $params[] = $hash;
    }

    if ($fields) {
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $id;
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    }

    $stmt = $pdo->prepare('SELECT id, username, email, phone, nik, role, created_at FROM users WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    respond($row ?: ['error' => 'not found'], $row ? 200 : 404);
}

respond(['error' => 'Method not allowed'], 405);
