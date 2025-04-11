const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pool = sequelize.define('Pool', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  latitude: { 
    type: DataTypes.FLOAT 
  },
  longitude: { 
    type: DataTypes.FLOAT 
  },
  description: {
    type: DataTypes.TEXT
  },
  entry_fee: { 
    type: DataTypes.INTEGER 
  },
  opening_hours: {
    type: DataTypes.STRING
  },
  website: {
    type: DataTypes.STRING
  }
});

module.exports = Pool;