module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Transferencia', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    cuenta_origen_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    cuenta_destino_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    valor: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'transferencias',
    timestamps: false
  });
};