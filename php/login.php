<?php
header('Content-Type: application/json');
require_once 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    echo json_encode(['success' => false, 'mensaje' => 'Datos inválidos.']);
    exit;
}

$email = $data['correo'] ?? '';
$password = $data['contrasena'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(['success' => false, 'mensaje' => 'Correo y contraseña son obligatorios.']);
    exit;
}

$sql = 'SELECT id, nombre, correo, rol FROM usuarios WHERE correo = ? AND contrasena = ? LIMIT 1';
$stmt = $pdo->prepare($sql);
$stmt->execute([$email, $password]);
$user = $stmt->fetch();

if ($user) {
    echo json_encode(['success' => true, 'mensaje' => 'Ingreso exitoso', 'rol' => $user['rol']]);
} else {
    echo json_encode(['success' => false, 'mensaje' => 'Credenciales incorrectas.']);
}
