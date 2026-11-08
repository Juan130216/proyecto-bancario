const express = require('express');
const enrutador = express.Router();
const movimientoControlador = require('../controladores/movimientoControlador');
const acceso = require('../acceso');

enrutador.post('/consignar', acceso('ADMIN'), movimientoControlador.consignar);
enrutador.get('/obtener', acceso('ADMIN'), movimientoControlador.obtenerMovimientos);

module.exports = enrutador;