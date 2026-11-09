const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { sequelize, Movimiento } = require('../baseDatos');
const cuentaServicio = require('./cuentaServicio');

const esquemaIngresar = Joi.object({
  numero_cuenta: Joi.string().trim().max(20).required(),
  pin: Joi.string().pattern(/^[0-9]{4}$/).required().messages({ 'string.pattern.base': 'El PIN debe tener 4 números' })
});
const esquemaRetirar = Joi.object({
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

const ingresar = async datos => {
  const { numero_cuenta, pin } = validar(esquemaIngresar, datos);
  const cuenta = await cuentaServicio.obtenerActiva(numero_cuenta);
  if (!(await bcrypt.compare(pin, cuenta.pin))) {
    const error = new Error('PIN incorrecto');
    error.status = 401;
    throw error;
  }
  return { numero_cuenta: cuenta.numero_cuenta };
};

const consultarSaldo = async numero_cuenta => {
  const cuenta = await cuentaServicio.obtenerActiva(numero_cuenta);
  return { numero_cuenta, saldo: cuenta.saldo };
};

const retirar = async (numero_cuenta, datos) => {
  const { valor } = validar(esquemaRetirar, datos);
  return sequelize.transaction(async t => {
    const cuenta = await cuentaServicio.obtenerActiva(numero_cuenta, t);
    if (Number(cuenta.saldo) < valor) {
      const error = new Error('Saldo insuficiente');
      error.status = 400;
      throw error;
    }
    await cuenta.decrement('saldo', { by: valor, transaction: t });
    await cuenta.reload({ transaction: t });
    return Movimiento.create({
      cuenta_id: cuenta.id,
      tipo: 'RETIRO_CAJERO',
      descripcion: 'Retiro cajero',
      valor: -valor,
      saldo_resultante: cuenta.saldo
    }, { transaction: t });
  });
};

const ultimosMovimientos = async numero_cuenta => {
  const cuenta = await cuentaServicio.obtenerActiva(numero_cuenta);
  return Movimiento.findAll({
    where: { cuenta_id: cuenta.id },
    attributes: ['id', 'fecha', 'tipo', 'descripcion', 'valor', 'saldo_resultante'],
    order: [['fecha', 'DESC'], ['id', 'DESC']],
    limit: 5
  });
};

module.exports = { ingresar, consultarSaldo, retirar, ultimosMovimientos };