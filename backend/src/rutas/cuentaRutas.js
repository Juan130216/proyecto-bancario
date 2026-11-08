const express = require('express');
const enrutador = express.Router();
const cuentaControlador = require('../controladores/cuentaControlador');
const acceso = require('../acceso');

enrutador.get('/obtener', acceso('ADMIN'), cuentaControlador.obtenerCuentas);
enrutador.get('/dashboard', acceso('ADMIN'), cuentaControlador.obtenerDashboard);

module.exports = enrutador;