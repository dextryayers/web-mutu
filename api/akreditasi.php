<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$pdo = get_pdo();
$method = request_method();
$action = $_GET['action'] ?? '';

// ensure period table exists (safe if already there)
$pdo->exec('CREATE TABLE IF NOT EXISTS akreditasi_periods (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  paripurna DECIMAL(5,2) NOT NULL DEFAULT 0,
  utama DECIMAL(5,2) NOT NULL DEFAULT 0,
  madya DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_period (year, month)
)');

if ($method === 'GET' && $action === 'periods') {
    $stmt = $pdo->query('SELECT year, month, paripurna, utama, madya, updated_at FROM akreditasi_periods ORDER BY year DESC, month DESC');
    $rows = $stmt->fetchAll();
    respond($rows);
}

if ($method === 'GET') {
    $year = isset($_GET['year']) ? (int)$_GET['year'] : 0;
    $month = isset($_GET['month']) ? (int)$_GET['month'] : 0;

    if ($year > 0 && $month >= 1 && $month <= 12) {
        // try period-specific value first
        $stmt = $pdo->prepare('SELECT paripurna, utama, madya FROM akreditasi_periods WHERE year = ? AND month = ?');
        $stmt->execute([$year, $month]);
        $row = $stmt->fetch();
        if ($row) {
            respond($row);
        }
        // fallback: default/global akreditasi
    }

    $stmt = $pdo->prepare('SELECT paripurna, utama, madya FROM akreditasi WHERE id = 1');
    $stmt->execute();
    $row = $stmt->fetch();
    if (!$row) {
        // initialize if missing
        $pdo->exec("INSERT IGNORE INTO akreditasi (id, paripurna, utama, madya) VALUES (1, 45, 35, 20)");
        $row = ['paripurna' => 45, 'utama' => 35, 'madya' => 20];
    }
    respond($row);
}

if ($method === 'PUT') {
    require_auth();
    $data = read_json();
    $paripurna = isset($data['paripurna']) ? (float)$data['paripurna'] : null;
    $utama = isset($data['utama']) ? (float)$data['utama'] : null;
    $madya = isset($data['madya']) ? (float)$data['madya'] : null;
    $year = isset($data['year']) ? (int)$data['year'] : (isset($_GET['year']) ? (int)$_GET['year'] : 0);
    $month = isset($data['month']) ? (int)$data['month'] : (isset($_GET['month']) ? (int)$_GET['month'] : 0);

    if ($paripurna === null || $utama === null || $madya === null) {
        respond(['error' => 'paripurna, utama, madya required'], 400);
    }

    if ($year > 0 && $month >= 1 && $month <= 12) {
        // upsert period-specific record
        $stmt = $pdo->prepare('INSERT INTO akreditasi_periods (year, month, paripurna, utama, madya) VALUES (?,?,?,?,?)
          ON DUPLICATE KEY UPDATE paripurna = VALUES(paripurna), utama = VALUES(utama), madya = VALUES(madya)');
        $stmt->execute([$year, $month, $paripurna, $utama, $madya]);
    } else {
        // fallback to global single-row akreditasi
        $stmt = $pdo->prepare('UPDATE akreditasi SET paripurna=?, utama=?, madya=? WHERE id=1');
        $stmt->execute([$paripurna, $utama, $madya]);
    }

    respond(['paripurna' => $paripurna, 'utama' => $utama, 'madya' => $madya]);
}

respond(['error' => 'Method not allowed'], 405);
