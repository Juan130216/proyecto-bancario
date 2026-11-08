const Joi = require('joi');
const { sequelize, Usuario, Cuenta, Movimiento } = require('../baseDatos');
const cuentaServicio = require('./cuentaServicio');

const esquemaConsignar = Joi.object({
  numero_cuenta: Joi.string().trim().max(20).required(),
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

const consignar = async datos => {
  const { numero_cuenta, valor } = validar(esquemaConsignar, datos);
  return sequelize.transaction(async t => {
    const cuenta = await cuentaServicio.obtenerActiva(numero_cuenta, t);
    await cuenta.increment('saldo', { by: valor, transaction: t });
    await cuenta.reload({ transaction: t });
    return Movimiento.create({
      cuenta_id: cuenta.id,
      tipo: 'CONSIGNACION',
      descripcion: 'Consignación',
      valor,
      saldo_resultante: cuenta.saldo
    }, { transaction: t });
  });
};

const obtenerTodos = () => Movimiento.findAll({
  include: [{
    model: Cuenta,
    as: 'cuenta',
    attributes: ['numero_cuenta'],
    include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }]
  }],
  order: [['fecha', 'DESC'], ['id', 'DESC']]
});

const obtenerPropios = usuario_id => Movimiento.findAll({
  attributes: ['id', 'fecha', 'tipo', 'descripcion', 'valor', 'saldo_resultante'],
  include: [{ model: Cuenta, as: 'cuenta', attributes: [], where: { usuario_id } }],
  order: [['fecha', 'DESC'], ['id', 'DESC']]
});

module.exports = { consignar, obtenerTodos, obtenerPropios };