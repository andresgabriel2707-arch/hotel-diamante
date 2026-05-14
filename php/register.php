<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos.']);
    exit;
}

$nombre = trim($data['nombre'] ?? '');
$correo = trim($data['correo'] ?? '');
$contrasena = trim($data['contrasena'] ?? '');
$edad = intval($data['edad'] ?? 0);
$documento = trim($data['documento'] ?? '');

if (empty($nombre) || empty($correo) || empty($contrasena) || empty($edad) || empty($documento)) {
    echo json_encode(['success' => false, 'mensaje' => 'Todos los campos son requeridos.']);
    exit;
}

try {
    $sql = 'INSERT INTO usuarios (nombre, correo, contrasena, edad, documento, rol) VALUES (?, ?, ?, ?, ?, "cliente")';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$nombre, $correo, $contrasena, $edad, $documento]);
    echo json_encode(['success' => true, 'mensaje' => 'Registro realizado correctamente.']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'mensaje' => 'Error al guardar usuario: ' . $e->getMessage()]);
}
