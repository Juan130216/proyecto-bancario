const { Usuario, Cuenta } = require('../baseDatos');

const obtenerTodas = () => Cuenta.findAll({
  attributes: ['id', 'numero_cuenta', 'tipo_cuenta', 'saldo'],
  include: [{
    model: Usuario,
    as: 'usuario',
    attributes: ['id', 'nombre', 'correo', 'estado']
  }],
  order: [['id', 'ASC']]
});

const obtenerDashboard = async () => {
  const clientes = { rol: 'CLIENTE' };
  return {
    totalClientes: await Usuario.count({ where: clientes }),
    clientesActivos: await Usuario.count({ where: { ...clientes, estado: 'ACTIVO' } }),
    clientesBloqueados: await Usuario.count({ where: { ...clientes, estado: 'BLOQUEADO' } }),
    saldoTotal: (await Cuenta.sum('saldo')) || 0
  };
};

const obtenerActiva = async (numero_cuenta, transaction) => {
  const cuenta = await Cuenta.findOne({
    where: { numero_cuenta },
    include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'estado'] }],
    transaction
  });
  if (!cuenta) {
    const error = new Error('La cuenta no existe');
    error.status = 404;
    throw error;
  }
  if (cuenta.usuario.estado !== 'ACTIVO') {
    const error = new Error('La cuenta no está activa');
    error.status = 403;
    throw error;
  }
  return cuenta;
};

module.exports = { obtenerTodas, obtenerDashboard, obtenerActiva };