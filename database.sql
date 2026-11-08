-- Simulador Bancario Web
-- Base de datos: simulador_bancario

CREATE DATABASE IF NOT EXISTS simulador_bancario
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE simulador_bancario;

DROP TABLE IF EXISTS transferencias;
DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS cuentas;
DROP TABLE IF EXISTS usuarios;

-- ---------------------------------------------------------
-- USUARIOS: administradores y clientes
-- ---------------------------------------------------------
CREATE TABLE usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(120) NOT NULL UNIQUE,
  telefono VARCHAR(20) NULL,
  direccion VARCHAR(150) NULL,
  password VARCHAR(100) NOT NULL,
  rol ENUM('ADMIN', 'CLIENTE') NOT NULL DEFAULT 'CLIENTE',
  estado ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO') NOT NULL DEFAULT 'ACTIVO',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------
-- CUENTAS: una cuenta por cliente
-- ---------------------------------------------------------
CREATE TABLE cuentas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  numero_cuenta VARCHAR(20) NOT NULL UNIQUE,
  usuario_id INT UNSIGNED NOT NULL UNIQUE,
  tipo_cuenta ENUM('AHORROS', 'CORRIENTE') NOT NULL DEFAULT 'AHORROS',
  pin VARCHAR(100) NOT NULL,
  saldo DECIMAL(15,2) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_saldo CHECK (saldo >= 0),
  CONSTRAINT fk_cuentas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------------
-- MOVIMIENTOS: historial de cada cuenta (no se eliminan)
-- valor positivo = entra dinero, negativo = sale dinero
-- ---------------------------------------------------------
CREATE TABLE movimientos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_id INT UNSIGNED NOT NULL,
  tipo ENUM('CONSIGNACION', 'RETIRO_CAJERO', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA') NOT NULL,
  descripcion VARCHAR(150) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  saldo_resultante DECIMAL(15,2) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movimientos_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuentas(id)
);

-- ---------------------------------------------------------
-- TRANSFERENCIAS: dinero enviado de una cuenta a otra
-- ---------------------------------------------------------
CREATE TABLE transferencias (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cuenta_origen_id INT UNSIGNED NOT NULL,
  cuenta_destino_id INT UNSIGNED NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_valor_transferencia CHECK (valor > 0),
  CONSTRAINT fk_transf_origen FOREIGN KEY (cuenta_origen_id) REFERENCES cuentas(id),
  CONSTRAINT fk_transf_destino FOREIGN KEY (cuenta_destino_id) REFERENCES cuentas(id)
);

-- ---------------------------------------------------------
-- DATOS DE PRUEBA
-- Admin:    admin@banco.com   / Admin123
-- Clientes: (correo)          / Cliente123
-- PIN cajero: Carlos 1234, Laura 4321, Andrés 1111
-- ---------------------------------------------------------
INSERT INTO usuarios (id, nombre, correo, telefono, direccion, password, rol, estado) VALUES
(1, 'Administrador', 'admin@banco.com', '3000000000', 'Oficina principal', '$2b$10$HY3nzb4i3nQdgUsZBdFF/urya/Qxgf4QxeLHLD12OsDGcu38fEMyi', 'ADMIN', 'ACTIVO'),
(2, 'Carlos Pérez', 'carlos@correo.com', '3101111111', 'Calle 10 # 5-20', '$2b$10$tZDzkKQ/3JZ2F7Vl42wgzul3a2IX2ESXhGCO8nzyVa6VFb0rKTfYm', 'CLIENTE', 'ACTIVO'),
(3, 'Laura Gómez', 'laura@correo.com', '3102222222', 'Carrera 7 # 12-30', '$2b$10$tZDzkKQ/3JZ2F7Vl42wgzul3a2IX2ESXhGCO8nzyVa6VFb0rKTfYm', 'CLIENTE', 'ACTIVO'),
(4, 'Andrés Ruiz', 'andres@correo.com', '3103333333', 'Avenida 3 # 8-15', '$2b$10$tZDzkKQ/3JZ2F7Vl42wgzul3a2IX2ESXhGCO8nzyVa6VFb0rKTfYm', 'CLIENTE', 'ACTIVO');

INSERT INTO cuentas (id, numero_cuenta, usuario_id, tipo_cuenta, pin, saldo) VALUES
(1, '1001000001', 2, 'AHORROS',   '$2b$10$26oFSmHqffgPdKSPR7/kVeL6NEoktPJxi8DE0DqkVTfszS5XqNkp.', 1000000),
(2, '1001000002', 3, 'CORRIENTE', '$2b$10$VbZYsHOWXVCMBnUpuCRZI.w5j6pcMwzX2KA1PEFV1QatnhomHx0gW', 2500000),
(3, '1001000003', 4, 'AHORROS',   '$2b$10$/U86xq0FPm.2ddin2lOLJeKS3c6QrBbVy8Kt1Tw2R55iF1kDElhoe', 500000);

INSERT INTO transferencias (id, cuenta_origen_id, cuenta_destino_id, valor, fecha) VALUES
(1, 1, 2, 200000, '2026-11-02 10:30:00');

INSERT INTO movimientos (cuenta_id, tipo, descripcion, valor, saldo_resultante, fecha) VALUES
(1, 'CONSIGNACION',           'Consignación inicial',           1200000, 1200000, '2026-11-01 09:00:00'),
(1, 'TRANSFERENCIA_ENVIADA',  'Transferencia a cuenta 1001000002', -200000, 1000000, '2026-11-02 10:30:00'),
(2, 'CONSIGNACION',           'Consignación inicial',           2300000, 2300000, '2026-11-01 09:05:00'),
(2, 'TRANSFERENCIA_RECIBIDA', 'Transferencia de cuenta 1001000001', 200000, 2500000, '2026-11-02 10:30:00'),
(3, 'CONSIGNACION',           'Consignación inicial',            600000,  600000, '2026-11-01 09:10:00'),
(3, 'RETIRO_CAJERO',          'Retiro cajero',                  -100000,  500000, '2026-11-03 15:20:00');