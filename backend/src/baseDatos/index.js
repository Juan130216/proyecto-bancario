require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const usuarioModelo = require('../modelos/usuario');
const cuentaModelo = require('../modelos/cuenta');
const movimientoModelo = require('../modelos/movimiento');
const transferenciaModelo = require('../modelos/transferencia');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  }
);

const Usuario = usuarioModelo(sequelize, DataTypes);
const Cuenta = cuentaModelo(sequelize, DataTypes);
const Movimiento = movimientoModelo(sequelize, DataTypes);
const Transferencia = transferenciaModelo(sequelize, DataTypes);

Usuario.hasOne(Cuenta, { as: 'cuenta', foreignKey: 'usuario_id' });
Cuenta.belongsTo(Usuario, { as: 'usuario', foreignKey: 'usuario_id' });
Cuenta.hasMany(Movimiento, { as: 'movimientos', foreignKey: 'cuenta_id' });
Movimiento.belongsTo(Cuenta, { as: 'cuenta', foreignKey: 'cuenta_id' });

async function conectarBaseDatos() {
  await sequelize.authenticate();
  console.log('Conectado a la base de datos.');
}

module.exports = { Usuario, Cuenta, Movimiento, Transferencia, sequelize, conectarBaseDatos };