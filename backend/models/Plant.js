module.exports = (sequelize, DataTypes) => {
  const Plant = sequelize.define("Plant", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    scientificName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1, // Minimum 1 plant
    },
    addedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  });

  Plant.associate = (models) => {
    Plant.belongsTo(models.User, {
      foreignKey: "addedBy",
      onDelete: "CASCADE"
    });
    // Plant's one-to-many association with GardeningLogs
    Plant.hasMany(models.GardeningLog, {
      foreignKey: 'plantId',
      as: 'maintenanceLogs', // Logs related to this specific plant
      onDelete: 'SET NULL' // If plant is deleted, logs reference null plantId
    });
  };

  return Plant;
};
