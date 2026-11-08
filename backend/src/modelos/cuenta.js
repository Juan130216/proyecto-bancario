module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Cuenta', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    numero_cuenta: { type: DataTypes.STRING(20), allowNull: false, unique: 'numero_cuenta' },
    usuario_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tipo_cuenta: { type: DataTypes.ENUM('AHORROS', 'CORRIENTE'), allowNull: false, defaultValue: 'AHORROS' },
    pin: { type: DataTypes.STRING(100), allowNull: false },
    saldo: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'cuentas',
    timestamps: true
  });
};