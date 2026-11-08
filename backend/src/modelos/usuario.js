module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Usuario', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    correo: { type: DataTypes.STRING(120), allowNull: false, unique: 'correo' },
    telefono: { type: DataTypes.STRING(20) },
    direccion: { type: DataTypes.STRING(150) },
    password: { type: DataTypes.STRING(100), allowNull: false },
    rol: { type: DataTypes.ENUM('ADMIN', 'CLIENTE'), allowNull: false, defaultValue: 'CLIENTE' },
    estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO', 'BLOQUEADO'), allowNull: false, defaultValue: 'ACTIVO' }
  }, {
    tableName: 'usuarios',
    timestamps: true
  });
};