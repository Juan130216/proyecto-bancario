module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Movimiento', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cuenta_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    tipo: {
      type: DataTypes.ENUM('CONSIGNACION', 'RETIRO_CAJERO', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECIBIDA'),
      allowNull: false
    },
    descripcion: { type: DataTypes.STRING(150), allowNull: false },
    valor: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    saldo_resultante: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'movimientos',
    timestamps: false
  });
};