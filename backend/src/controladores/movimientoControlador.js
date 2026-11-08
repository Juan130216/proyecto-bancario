const movimientoServicio = require('../servicios/movimientoServicio');

const consignar = async (req, res) => {
  try {
    res.status(201).json({
      mensaje: 'Consignación realizada',
      resultado: await movimientoServicio.consignar(req.body)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerMovimientos = async (_req, res) => {
  try {
    res.json({
      mensaje: 'Historial general de movimientos',
      resultado: await movimientoServicio.obtenerTodos()
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerMisMovimientos = async (req, res) => {
  try {
    res.json({
      mensaje: 'Historial de movimientos',
      resultado: await movimientoServicio.obtenerPropios(req.session.usuario.id)
    });
  } catch (error) {
    responderError(res, error);
  }
};

function responderError(res, error) {
  res.status(error.status || 500).json({
    mensaje: error.status && error.status < 500 ? error.message : 'Error interno del servidor',
    resultado: null
  });
}

module.exports = { consignar, obtenerMovimientos, obtenerMisMovimientos };