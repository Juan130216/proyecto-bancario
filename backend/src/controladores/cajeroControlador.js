const cajeroServicio = require('../servicios/cajeroServicio');

const ingresar = async (req, res) => {
  try {
    const cuenta = await cajeroServicio.ingresar(req.body);
    req.session.cajero = cuenta;
    res.json({ mensaje: 'Bienvenido al cajero', resultado: cuenta });
  } catch (error) {
    responderError(res, error);
  }
};
const consultarSaldo = async (req, res) => {
  try {
    res.json({
      mensaje: 'Saldo disponible',
      resultado: await cajeroServicio.consultarSaldo(req.session.cajero.numero_cuenta)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const retirar = async (req, res) => {
  try {
    res.status(201).json({
      mensaje: 'Retiro realizado',
      resultado: await cajeroServicio.retirar(req.session.cajero.numero_cuenta, req.body)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const obtenerMovimientos = async (req, res) => {
  try {
    res.json({
      mensaje: 'Últimos movimientos',
      resultado: await cajeroServicio.ultimosMovimientos(req.session.cajero.numero_cuenta)
    });
  } catch (error) {
    responderError(res, error);
  }
};
const salir = (req, res) => {
  delete req.session.cajero;
  res.json({ mensaje: 'Operación finalizada', resultado: null });
};

function responderError(res, error) {
  res.status(error.status || 500).json({
    mensaje: error.status && error.status < 500 ? error.message : 'Error interno del servidor',
    resultado: null
  });
}

module.exports = { ingresar, consultarSaldo, retirar, obtenerMovimientos, salir };