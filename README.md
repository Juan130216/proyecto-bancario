# Proyecto Bancario

Estructura inicial para desarrollar un simulador bancario con backend por
capas, frontend web y base de datos MySQL.

## Estructura

- `backend/src/baseDatos/`: conexión y configuración de la base de datos.
- `backend/src/controladores/`: manejo de solicitudes.
- `backend/src/modelos/`: entidades y acceso a datos.
- `backend/src/rutas/`: definición de rutas HTTP.
- `backend/src/servicios/`: lógica de negocio.
- `backend/test/`: pruebas del backend.
- `frontend/`: archivos iniciales de la interfaz web.
- `crear_base_datos.sql`: creación de la base de datos y sus tablas.

## Requisitos

- Node.js 18 o superior.
- MySQL 8 o compatible.

## Preparación

1. Ejecuta `crear_base_datos.sql` en MySQL.
2. Copia `backend/.env.example` a `backend/.env` y configura tus valores
   locales.
3. Desde `backend/`, ejecuta `npm install` para preparar el proyecto.
4. Abre `frontend/index.html` en un navegador para ver la página inicial.
5. Ejecuta `npm test` desde `backend/` cuando agregues pruebas.

No guardes credenciales reales en el control de versiones; `backend/.env` está
excluido por el `.gitignore` del backend.
