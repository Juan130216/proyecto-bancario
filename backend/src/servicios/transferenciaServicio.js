const Joi = require('joi');
const { sequelize, Cuenta, Movimiento, Transferencia } = require('../baseDatos');
const cuentaServicio = require('./cuentaServicio');

const esquemaTransferir = Joi.object({
  numero_cuenta_destino: Joi.string().trim().max(20).required(),
  valor: Joi.number().positive().precision(2).required().messages({
    'number.base': 'El valor debe ser un número',
    'number.positive': 'El valor debe ser mayor que cero',
    'any.required': 'El valor es obligatorio'
  })
});

function validar(esquema, datos) {
  const { error, value } = esquema.validate(datos, { abortEarly: false });
  if (error) {
    const errorValidacion = new Error(error.details.map(d => d.message).join(' | '));
    errorValidacion.status = 400;
    throw errorValidacion;
  }
  return value;
}

function rechazar(mensaje) {
  const error = new Error(mensaje);
  error.status = 400;
  throw error;
}

const transferir = async (usuario_id, datos) => {
  const { numero_cuenta_destino, valor } = validar(esquemaTransferir, datos);
  return sequelize.transaction(async t => {
    const propia = await Cuenta.findOne({ where: { usuario_id }, attributes: ['numero_cuenta'], transaction: t });
    const origen = await cuentaServicio.obtenerActiva(propia.numero_cuenta, t);
    const destino = await cuentaServicio.obtenerActiva(numero_cuenta_destino, t);

    if (origen.id === destino.id) rechazar('No puede transferir a su propia cuenta');
    if (Number(origen.saldo) < valor) rechazar('Saldo insuficiente');

    await origen.decrement('saldo', { by: valor, transaction: t });
    await destino.increment('saldo', { by: valor, transaction: t });
    await origen.reload({ transaction: t });
    await destino.reload({ transaction: t });

    const transferencia = await Transferencia.create({
      cuenta_origen_id: origen.id,
      cuenta_destino_id: destino.id,
      valor
    }, { transaction: t });

    await Movimiento.bulkCreate([
      {
        cuenta_id: origen.id,
        tipo: 'TRANSFERENCIA_ENVIADA',
        descripcion: `Transferencia a cuenta ${destino.numero_cuenta}`,
        valor: -valor,
        saldo_resultante: origen.saldo
      },
      {
        cuenta_id: destino.id,
        tipo: 'TRANSFERENCIA_RECIBIDA',
        descripcion: `Transferencia de cuenta ${origen.numero_cuenta}`,
        valor,
        saldo_resultante: destino.saldo
      }
    ], { transaction: t });

    return transferencia;
  });
};

module.exports = { transferir };