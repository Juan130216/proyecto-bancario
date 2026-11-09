const transferenciaServicio = require('../servicios/transferenciaServicio');

const transferir = async (req, res) => {
  try {
    res.status(201).json({
      mensaje: 'Transferencia realizada',
      resultado: await transferenciaServicio.transferir(req.session.usuario.id, req.body)
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

module.exports = { transferir };