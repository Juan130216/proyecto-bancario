const express = require('express');
const enrutador = express.Router();
const usuarioControlador = require('../controladores/usuarioControlador');
const acceso = require('../acceso');

enrutador.post('/crear', acceso('ADMIN'), usuarioControlador.crearCliente);
enrutador.get('/obtener', acceso('ADMIN'), usuarioControlador.obtenerClientes);
enrutador.get('/obtener/:id', acceso('ADMIN'), usuarioControlador.obtenerCliente);
enrutador.put('/actualizar/:id', acceso('ADMIN'), usuarioControlador.actualizarCliente);
enrutador.put('/estado/:id', acceso('ADMIN'), usuarioControlador.cambiarEstadoCliente);

enrutador.get('/perfil', acceso('CLIENTE'), usuarioControlador.obtenerPerfil);
enrutador.put('/perfil', acceso('CLIENTE'), usuarioControlador.actualizarPerfil);
enrutador.put('/password', acceso('CLIENTE'), usuarioControlador.cambiarPassword);

module.exports = enrutador;