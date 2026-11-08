const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, Usuario, Cuenta } = require('../baseDatos');

const datosCliente = {
  nombre: Joi.string().trim().min(3).max(100).required(),
  correo: Joi.string().trim().email().max(120).required(),
  telefono: Joi.string().trim().max(20).allow(''),
  direccion: Joi.string().trim().max(150).allow('')
};
const esquemaCrear = Joi.object({
  ...datosCliente,
  password: Joi.string().min(6).max(50).required(),
  tipo_cuenta: Joi.string().valid('AHORROS', 'CORRIENTE').required(),
  pin: Joi.string().pattern(/^[0-9]{4}$/).required().messages({ 'string.pattern.base': 'El PIN debe tener 4 números' })
});
const esquemaEditar = Joi.object(datosCliente);
const esquemaEstado = Joi.object({
  estado: Joi.string().valid('ACTIVO', 'INACTIVO', 'BLOQUEADO').required()
});
const esquemaPerfil = Joi.object({
  telefono: Joi.string().trim().max(20).allow(''),
  direccion: Joi.string().trim().max(150).allow('')
});
const esquemaPassword = Joi.object({
  password_actual: Joi.string().required(),
  password_nueva: Joi.string().min(6).max(50).required()
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

const incluirCuenta = {
  model: Cuenta,
  as: 'cuenta',
  attributes: ['id', 'numero_cuenta', 'tipo_cuenta', 'saldo']
};
const sinPassword = { exclude: ['password'] };

const obtenerPorId = async id => {
  const cliente = await Usuario.findOne({
    where: { id, rol: 'CLIENTE' },
    attributes: sinPassword,
    include: [incluirCuenta]
  });
  if (!cliente) {
    const error = new Error('Cliente no encontrado');
    error.status = 404;
    throw error;
  }
  return cliente;
};

const crear = async datos => {
  const { password, pin, tipo_cuenta, ...datosUsuario } = validar(esquemaCrear, datos);
  const id = await sequelize.transaction(async t => {
    const usuario = await Usuario.create(
      { ...datosUsuario, password: await bcrypt.hash(password, 10) },
      { transaction: t }
    );
    const ultimo = await Cuenta.max('numero_cuenta', { transaction: t });
    await Cuenta.create({
      numero_cuenta: String(Number(ultimo || 1001000000) + 1),
      usuario_id: usuario.id,
      tipo_cuenta,
      pin: await bcrypt.hash(pin, 10)
    }, { transaction: t });
    return usuario.id;
  });
  return obtenerPorId(id);
};

const obtenerTodos = buscar => {
  const donde = { rol: 'CLIENTE' };
  if (buscar) {
    donde[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { correo: { [Op.like]: `%${buscar}%` } }
    ];
  }
  return Usuario.findAll({
    where: donde,
    attributes: sinPassword,
    include: [incluirCuenta],
    order: [['id', 'DESC']]
  });
};

const actualizar = async (id, datos) => {
  const cliente = await obtenerPorId(id);
  return cliente.update(validar(esquemaEditar, datos));
};

const cambiarEstado = async (id, datos) => {
  const cliente = await obtenerPorId(id);
  return cliente.update(validar(esquemaEstado, datos));
};

const actualizarPerfil = async (id, datos) => {
  const cliente = await obtenerPorId(id);
  return cliente.update(validar(esquemaPerfil, datos));
};

const cambiarPassword = async (id, datos) => {
  const { password_actual, password_nueva } = validar(esquemaPassword, datos);
  const usuario = await Usuario.findByPk(id);
  if (!(await bcrypt.compare(password_actual, usuario.password))) {
    const error = new Error('La contraseña actual es incorrecta');
    error.status = 400;
    throw error;
  }
  await usuario.update({ password: await bcrypt.hash(password_nueva, 10) });
};

module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  actualizar,
  cambiarEstado,
  actualizarPerfil,
  cambiarPassword
};