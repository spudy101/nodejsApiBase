const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoginAttempts = sequelize.define('LoginAttempts', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    blockedUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'login_attempts',
    timestamps: true
  });

  return LoginAttempts;
};
