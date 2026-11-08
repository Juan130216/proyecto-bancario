const authServicio = require('../servicios/authServicio');

const iniciarSesion = async (req, res) => {
  try {
    const usuario = await authServicio.iniciarSesion(req.body);
    req.session.usuario = usuario;
    res.json({ mensaje: `Bienvenido ${usuario.nombre}`, resultado: usuario });
  } catch (error) {
    responderError(res, error);
  }
};
const cerrarSesion = (req, res) => {
  req.session.destroy(() => res.json({ mensaje: 'Sesión cerrada', resultado: null }));
};
const obtenerSesion = (req, res) => {
  res.json({ mensaje: 'Sesión activa', resultado: req.session.usuario });
};

function responderError(res, error) {
  res.status(error.status || 500).json({
    mensaje: error.status && error.status < 500 ? error.message : 'Error interno del servidor',
    resultado: null
  });
}

module.exports = { iniciarSesion, cerrarSesion, obtenerSesion };