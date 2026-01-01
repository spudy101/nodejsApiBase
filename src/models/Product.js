const { DataTypes } = require('sequelize');
 
module.exports = (sequelize) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre es requerido'
        },
        len: {
          args: [3, 200],
          msg: 'El nombre debe tener entre 3 y 200 caracteres'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: {
          args: [0],
          msg: 'El precio debe ser mayor o igual a 0'
        },
        isDecimal: {
          msg: 'El precio debe ser un número decimal válido'
        }
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'El stock debe ser mayor o igual a 0'
        },
        isInt: {
          msg: 'El stock debe ser un número entero'
        }
      }
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    tableName: 'products',
    timestamps: true
  });

  // Asociaciones
  Product.associate = (models) => {
    Product.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
  };

  return Product;
};