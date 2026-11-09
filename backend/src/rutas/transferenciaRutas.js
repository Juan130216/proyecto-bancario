const express = require('express');
const enrutador = express.Router();
const transferenciaControlador = require('../controladores/transferenciaControlador');
const acceso = require('../acceso');

enrutador.post('/crear', acceso('CLIENTE'), transferenciaControlador.transferir);

module.exports = enrutador;