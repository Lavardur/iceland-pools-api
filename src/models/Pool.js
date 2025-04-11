const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pool = sequelize.define('Pool', {
  name: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.GEOGRAPHY('POINT') },
  entry_fee: { type: DataTypes.INTEGER },
});

module.exports = Pool;