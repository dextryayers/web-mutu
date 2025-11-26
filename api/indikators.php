<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/utils.php';

$pdo = get_pdo();
$method = request_method();

function calculate_status($capaian, $target) {
    return $capaian >= $target ? 'Mencapai Target' : 'Tidak Mencapai Target';
}

if ($method === 'GET') {
    $month = isset($_GET['month']) ? (int)$_GET['month'] : 0;
    $year = isset($_GET['year']) ? (int)$_GET['year'] : 0;
    $where = [];
    $params = [];
    if ($month) {
        $where[] = 'MONTH(`date`) = ?';
        $params[] = $month;
    }
    if ($year) {
        $where[] = 'YEAR(`date`) = ?';
        $params[] = $year;
    }
    $sql = 'SELECT id, name, region, capaian, target, status, date FROM indikators';
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= ' ORDER BY id ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    respond($rows);
}

if ($method === 'POST') {
    require_auth();
    $data = read_json();
    $name = trim($data['name'] ?? '');
    $region = isset($data['region']) ? trim($data['region']) : null;
    $capaian = (float)($data['capaian'] ?? 0);
    $target = (float)($data['target'] ?? 100);
    $date = isset($data['date']) ? $data['date'] : null;
    if ($name === '') respond(['error' => 'name required'], 400);
    $status = calculate_status($capaian, $target);
    $stmt = $pdo->prepare('INSERT INTO indikators (name, region, capaian, target, status, date) VALUES (?,?,?,?,?,?)');
    $stmt->execute([$name, $region, $capaian, $target, $status, $date]);
    $id = (int)$pdo->lastInsertId();
    respond(['id' => $id, 'name' => $name, 'region' => $region, 'capaian' => $capaian, 'target' => $target, 'status' => $status, 'date' => $date], 201);
}

if ($method === 'PUT') {
    require_auth();
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $data = read_json();
    if ($id > 0) {
        $name = isset($data['name']) ? trim($data['name']) : null;
        $region = isset($data['region']) ? trim($data['region']) : null;
        $capaian = isset($data['capaian']) ? (float)$data['capaian'] : null;
        $target = isset($data['target']) ? (float)$data['target'] : null;
        $date = isset($data['date']) ? $data['date'] : null;
        if ($name === null || $capaian === null || $target === null) respond(['error' => 'name, capaian, target required'], 400);

        // allow explicit status from client, but validate against allowed values
        if (isset($data['status']) && in_array($data['status'], ['Mencapai Target', 'Tidak Mencapai Target'], true)) {
            $status = $data['status'];
        } else {
            $status = calculate_status($capaian, $target);
        }
        $stmt = $pdo->prepare('UPDATE indikators SET name=?, region=?, capaian=?, target=?, status=?, date=? WHERE id=?');
        $stmt->execute([$name, $region, $capaian, $target, $status, $date, $id]);
        respond(['id' => $id, 'name' => $name, 'region' => $region, 'capaian' => $capaian, 'target' => $target, 'status' => $status, 'date' => $date]);
    } else {
        $items = $data['items'] ?? $data;
        if (!is_array($items)) respond(['error' => 'items array required'], 400);
        $pdo->beginTransaction();
        $pdo->exec('TRUNCATE TABLE indikators');
        $out = [];
        $stmt = $pdo->prepare('INSERT INTO indikators (name, region, capaian, target, status, date) VALUES (?,?,?,?,?,?)');
        foreach ($items as $row) {
            $name = trim($row['name'] ?? '');
            if ($name === '') continue;
            $region = isset($row['region']) ? trim($row['region']) : null;
            $capaian = (float)($row['capaian'] ?? 0);
            $target = (float)($row['target'] ?? 100);
            $date = isset($row['date']) ? $row['date'] : null;
            $status = calculate_status($capaian, $target);
            $stmt->execute([$name, $region, $capaian, $target, $status, $date]);
            $out[] = [
                'id' => (int)$pdo->lastInsertId(),
                'name' => $name,
                'region' => $region,
                'capaian' => $capaian,
                'target' => $target,
                'status' => $status,
                'date' => $date,
            ];
        }
        $pdo->commit();
        respond($out);
    }
}

if ($method === 'DELETE') {
    require_auth();
    $id = require_id();
    $stmt = $pdo->prepare('DELETE FROM indikators WHERE id=?');
    $stmt->execute([$id]);
    respond(['deleted' => true]);
}

respond(['error' => 'Method not allowed'], 405);
