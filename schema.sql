-- ╔══════════════════════════════════════════════╗
-- ║  Hotel Diamante — Schema MySQL (JDBC)       ║
-- ║  Base de datos normalizada (7 tablas)        ║
-- ║  Ejecutar en phpMyAdmin o CLI de MySQL       ║
-- ╚══════════════════════════════════════════════╝

CREATE DATABASE IF NOT EXISTS hotel_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_management;

-- ══════════════════════════════════════════════
-- 1. Tabla de Roles
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(120)
);

-- Datos iniciales de roles
INSERT IGNORE INTO roles (nombre, descripcion) VALUES
('admin', 'Administrador del sistema'),
('cliente', 'Cliente huésped del hotel');

-- ══════════════════════════════════════════════
-- 2. Tabla de Usuarios (cuentas de acceso)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- ══════════════════════════════════════════════
-- 3. Tabla de Clientes (datos personales)
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    edad INT NOT NULL DEFAULT 0,
    documento VARCHAR(80) NOT NULL DEFAULT '',
    telefono VARCHAR(20) DEFAULT '',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ══════════════════════════════════════════════
-- 4. Tabla de Tipos de Cabaña
--    Cada tipo tiene sus propias imágenes, valores y descripción editables
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS tipo_cabana (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    imagen_principal VARCHAR(500),
    imagen_2 VARCHAR(500),
    imagen_3 VARCHAR(500),
    precio_base DECIMAL(10,2) NOT NULL DEFAULT 0,
    capacidad_max INT NOT NULL DEFAULT 2,
    amenidades TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

-- Datos iniciales de tipos
INSERT IGNORE INTO tipo_cabana (nombre, descripcion, imagen_principal, precio_base, capacidad_max, amenidades) VALUES
('Romántica', 'Ideal para parejas, ambiente íntimo y acogedor con vista al río', 'images/cabana-romantica.jpg', 350000, 2, 'Vista al río, chimenea, terraza privada'),
('Familiar', 'Espaciosa, perfecta para familias con niños y amplia terraza', 'images/cabana-familiar.jpg', 550000, 6, 'Terraza amplia, cocina equipada, zona BBQ'),
('Lujo', 'Premium con jacuzzi, servicios exclusivos y decoración de primera', 'images/cabana-lujo.jpg', 750000, 4, 'Jacuzzi, minibar, servicio a la habitación');

-- ══════════════════════════════════════════════
-- 5. Tabla de Cabañas
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS cabanas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    tipo_id INT NOT NULL,
    estado ENUM('Disponible','Ocupado','Reservado') NOT NULL DEFAULT 'Disponible',
    precio DECIMAL(10,2) NOT NULL,
    capacidad INT NOT NULL DEFAULT 2,
    descripcion TEXT,
    FOREIGN KEY (tipo_id) REFERENCES tipo_cabana(id)
);

-- Datos iniciales de cabañas
INSERT IGNORE INTO cabanas (nombre, tipo_id, estado, precio, capacidad, descripcion) VALUES
('Diamante 1', 1, 'Disponible', 350000, 2, 'Cabaña romántica con vista al río.'),
('Diamante 2', 2, 'Disponible', 550000, 6, 'Cabaña familiar con amplia terraza.'),
('Diamante 3', 3, 'Disponible', 750000, 4, 'Cabaña de lujo con jacuzzi.');

-- ══════════════════════════════════════════════
-- 6. Tabla de Estados de Reserva
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS estado_reserva (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL UNIQUE,
    descripcion VARCHAR(120)
);

-- Datos iniciales de estados
INSERT IGNORE INTO estado_reserva (nombre, descripcion) VALUES
('Pendiente', 'Reserva recibida, pendiente de confirmación'),
('Confirmada', 'Reserva confirmada por el administrador'),
('Activa', 'Huésped actualmente alojado'),
('Completada', 'Estadía finalizada'),
('Cancelada', 'Reserva cancelada');

-- ══════════════════════════════════════════════
-- 7. Tabla de Reservas
-- ══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    cabana_id INT NOT NULL,
    estado_id INT NOT NULL,
    fecha_llegada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    pago_estado ENUM('Pendiente','Pagado') NOT NULL DEFAULT 'Pendiente',
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(50) DEFAULT 'Por definir',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (cabana_id) REFERENCES cabanas(id) ON DELETE CASCADE,
    FOREIGN KEY (estado_id) REFERENCES estado_reserva(id)
);

-- ── Índice para consultas anti-overbooking rápidas ──
CREATE INDEX idx_reservas_disponibilidad ON reservas (cabana_id, estado_id, fecha_llegada, fecha_salida);

-- ══════════════════════════════════════════════
-- Admin por defecto (contraseña: Admin123, hasheada con BCrypt)
-- El hash se genera en el código Java al iniciar
-- ══════════════════════════════════════════════
