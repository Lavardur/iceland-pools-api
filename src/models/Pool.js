const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pool = sequelize.define('Pool', {
  name: { type: DataTypes.STRING, allowNull: false },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
  entry_fee: { type: DataTypes.INTEGER },
});

module.exports = Pool;