const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Facility = sequelize.define('Facility', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hot_tub: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sauna: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  water_slide: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  child_friendly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  disabled_access: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gym: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Facility;