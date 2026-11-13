const express = require('express');
const enrutador = express.Router();
const authControlador = require('../controladores/authControlador');
const acceso = require('../acceso');

enrutador.post('/login', authControlador.iniciarSesion);
enrutador.post('/logout', authControlador.cerrarSesion);
enrutador.get('/sesion', acceso(), authControlador.obtenerSesion);

module.exports = enrutador;



