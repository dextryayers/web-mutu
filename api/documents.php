<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/config.php';

$pdo = get_pdo();
$method = request_method();

if ($method === 'GET') {
    // Hanya kembalikan dokumen publik untuk ditampilkan di halaman download.
    // Foto profil admin yang diupload lewat My Profile punya pola deskripsi
    // "Foto profil admin ..." dan disimpan di tabel yang sama, tapi tidak perlu
    // tampil sebagai dokumen publik.
    $stmt = $pdo->query(
        "SELECT id, title, description, file_url, created_at
         FROM documents
         WHERE description NOT LIKE 'Foto profil admin %'
         ORDER BY id DESC"
    );
    $rows = $stmt->fetchAll();
    respond($rows);
}

if ($method === 'POST') {
    require_auth();
    if (!isset($_FILES['file'])) {
        respond(['error' => 'file required'], 400);
    }
    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) {
        respond(['error' => 'upload error'], 400);
    }
    // Basic validation: size and extension whitelist
    $maxSize = 10 * 1024 * 1024; // 10 MB
    if ($file['size'] > $maxSize) respond(['error' => 'file too large (max 10MB)'], 400);

    $allowedExt = ['pdf','doc','docx','xls','xlsx','png','jpg','jpeg'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($ext === '') respond(['error' => 'file must have an extension'], 400);
    if (!in_array($ext, $allowedExt, true)) respond(['error' => 'file type not allowed'], 400);

    // Validate MIME type using finfo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    $allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/png',
        'image/jpeg',
    ];
    if (!in_array($mime, $allowedMimes, true)) {
        respond(['error' => 'MIME type not allowed: ' . $mime], 400);
    }

    $uploads = __DIR__ . '/uploads';
    if (!is_dir($uploads)) mkdir($uploads, 0755, true);
    @chmod($uploads, 0755);

    // Prevent executable uploads and ensure safe filename
    $name = time() . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    $target = $uploads . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        respond(['error' => 'cannot move uploaded file'], 500);
    }

    // Create .htaccess to block direct PHP execution in uploads (safe default)
    $ht = $uploads . '/.htaccess';
    if (!file_exists($ht)) {
        @file_put_contents($ht, "<FilesMatch \"\\.(php|phar|phtml|php3|php4|php5)\">\n  Require all denied\n</FilesMatch>\nOptions -Indexes\n");
        @chmod($ht, 0644);
    }

    $fileUrl = rtrim(BASE_URL, '/') . '/uploads/' . $name;
    if ($title === '') $title = $file['name'];
    $title = mb_substr(trim($title), 0, 250);
    $description = trim($description);

    $stmt = $pdo->prepare('INSERT INTO documents (title, description, file_url) VALUES (?, ?, ?)');
    $stmt->execute([$title, $description, $fileUrl]);
    $id = (int)$pdo->lastInsertId();
    respond(['id' => $id, 'title' => $title, 'description' => $description, 'file_url' => $fileUrl], 201);
}

if ($method === 'PUT') {
    require_auth();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $data = read_json();
    if ($id <= 0) {
        respond(['error' => 'id required'], 400);
    }
    $fields = [];
    $params = [];
    if (isset($data['title'])) {
        $fields[] = 'title=?';
        $params[] = mb_substr(trim($data['title']), 0, 250);
    }
    if (array_key_exists('description', $data)) {
        $fields[] = 'description=?';
        $params[] = trim((string)$data['description']);
    }
    if (!$fields) {
        respond(['error' => 'No fields to update'], 400);
    }
    $params[] = $id;
    $sql = 'UPDATE documents SET ' . implode(', ', $fields) . ' WHERE id=?';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $stmt = $pdo->prepare('SELECT id, title, description, file_url FROM documents WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    respond($row ?: ['id' => $id]);
}

if ($method === 'DELETE') {
    require_auth();
    $id = require_id();

    // Try to remove file if local
    $stmt = $pdo->prepare('SELECT file_url FROM documents WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if ($row) {
        $filePath = __DIR__ . '/uploads/' . basename($row['file_url']);
        if (file_exists($filePath)) {
            @unlink($filePath);
        }
    }

    // Delete record from database
    $stmt = $pdo->prepare('DELETE FROM documents WHERE id=?');
    $stmt->execute([$id]);
    respond(['deleted' => true]);
}

respond(['error' => 'Method not allowed'], 405);
