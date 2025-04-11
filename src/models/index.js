const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');
const Pool = require('./Pool');
const Facility = require('./Facility');
const User = require('./User');
const Review = require('./Review');

// Pool - Facility (One-to-One)
Pool.hasOne(Facility, {
  foreignKey: 'pool_id',
  onDelete: 'CASCADE'
});
Facility.belongsTo(Pool, {
  foreignKey: 'pool_id'
});

// Pool - Review (One-to-Many)
Pool.hasMany(Review, {
  foreignKey: 'pool_id',
  onDelete: 'CASCADE'
});
Review.belongsTo(Pool, {
  foreignKey: 'pool_id'
});

// User - Review (One-to-Many)
User.hasMany(Review, {
  foreignKey: 'user_id',
  onDelete: 'CASCADE'
});
Review.belongsTo(User, {
  foreignKey: 'user_id'
});

module.exports = {
  sequelize,
  Sequelize,
  Pool,
  Facility,
  User,
  Review
};