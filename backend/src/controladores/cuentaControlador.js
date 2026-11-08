const cuentaServicio = require('../servicios/cuentaServicio');

const obtenerCuentas = async (_req, res) => {
  try {
    res.json({
      mensaje: 'Lista de cuentas',
      resultado: await cuentaServicio.obtenerTodas()
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerDashboard = async (_req, res) => {
  try {
    res.json({
      mensaje: 'Dashboard del banco',
      resultado: await cuentaServicio.obtenerDashboard()
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

module.exports = { obtenerCuentas, obtenerDashboard };