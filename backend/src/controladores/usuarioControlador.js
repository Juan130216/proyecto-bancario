const usuarioServicio = require('../servicios/usuarioServicio');

const crearCliente = async (req, res) => {
  try {
    const cliente = await usuarioServicio.crear(req.body);
    res.status(201).json({
      mensaje: `Cliente ${cliente.nombre} fue creado`,
      resultado: cliente
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerClientes = async (req, res) => {
  try {
    res.json({
      mensaje: 'Lista de clientes',
      resultado: await usuarioServicio.obtenerTodos(req.query.buscar)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerCliente = async (req, res) => {
  try {
    res.json({
      mensaje: 'Cliente encontrado',
      resultado: await usuarioServicio.obtenerPorId(req.params.id)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const actualizarCliente = async (req, res) => {
  try {
    res.json({
      mensaje: 'Cliente actualizado',
      resultado: await usuarioServicio.actualizar(req.params.id, req.body)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const cambiarEstadoCliente = async (req, res) => {
  try {
    res.json({
      mensaje: 'Estado del cliente actualizado',
      resultado: await usuarioServicio.cambiarEstado(req.params.id, req.body)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerPerfil = async (req, res) => {
  try {
    res.json({
      mensaje: 'Perfil del cliente',
      resultado: await usuarioServicio.obtenerPorId(req.session.usuario.id)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const actualizarPerfil = async (req, res) => {
  try {
    res.json({
      mensaje: 'Perfil actualizado',
      resultado: await usuarioServicio.actualizarPerfil(req.session.usuario.id, req.body)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const cambiarPassword = async (req, res) => {
  try {
    await usuarioServicio.cambiarPassword(req.session.usuario.id, req.body);
    res.json({
      mensaje: 'Contraseña actualizada',
      resultado: null
    });
  } catch (error) {
    responderError(res, error);
  }
};

function responderError(res, error) {
  const duplicado = error.name === 'SequelizeUniqueConstraintError';
  res.status(duplicado ? 409 : (error.status || 500)).json({
    mensaje: duplicado ? 'El correo ya existe' : (error.status && error.status < 500 ? error.message : 'Error interno del servidor'),
    resultado: null
  });
}

module.exports = {
  crearCliente,
  obtenerClientes,
  obtenerCliente,
  actualizarCliente,
  cambiarEstadoCliente,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword
};