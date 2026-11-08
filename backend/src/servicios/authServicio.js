const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { Usuario } = require('../baseDatos');

const esquema = Joi.object({
  correo: Joi.string().trim().email().required(),
  password: Joi.string().required()
});

function validar(datos) {
  const { error, value } = esquema.validate(datos, { abortEarly: false });
  if (error) {
    const errorValidacion = new Error(error.details.map(d => d.message).join(' | '));
    errorValidacion.status = 400;
    throw errorValidacion;
  }
  return value;
}

const iniciarSesion = async datos => {
  const { correo, password } = validar(datos);
  const usuario = await Usuario.findOne({ where: { correo } });
  if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
    const error = new Error('Correo o contraseña incorrectos');
    error.status = 401;
    throw error;
  }
  if (usuario.estado !== 'ACTIVO') {
    const error = new Error('Usuario bloqueado o inactivo');
    error.status = 403;
    throw error;
  }
  return { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
};

module.exports = { iniciarSesion };