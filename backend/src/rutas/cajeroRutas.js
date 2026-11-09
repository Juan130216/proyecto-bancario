const express = require('express');
const enrutador = express.Router();
const cajeroControlador = require('../controladores/cajeroControlador');
const acceso = require('../acceso');

enrutador.post('/ingresar', cajeroControlador.ingresar);
enrutador.get('/saldo', acceso.cajero, cajeroControlador.consultarSaldo);
enrutador.post('/retirar', acceso.cajero, cajeroControlador.retirar);
enrutador.get('/movimientos', acceso.cajero, cajeroControlador.obtenerMovimientos);
enrutador.post('/salir', cajeroControlador.salir);

module.exports = enrutador;