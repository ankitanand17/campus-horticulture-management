// models/GardeningLog.js
module.exports = (sequelize, DataTypes) => {
    const GardeningLog = sequelize.define("GardeningLog", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        taskType: {
            // 'watered', 'gazed_grass', 'cut_plant', 'reported_dead'
            type: DataTypes.ENUM('watered', 'gazed_grass', 'cut_plant', 'reported_dead', 'other'),
            allowNull: false,
        },
        dateOfTask: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        areaDescription: { // E.g., "Rose garden near library", "Admin block lawn sector A"
            type: DataTypes.STRING,
            allowNull: true, 
        },
        plantId: { 
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Plants',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // Foreign Key for the gardener who performed the task
        gardenerUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users', 
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    });

    GardeningLog.associate = (models) => {
        GardeningLog.belongsTo(models.User, {
            foreignKey: 'gardenerUserId',
            as: 'gardener'
        });
        GardeningLog.belongsTo(models.Plant, { 
            foreignKey: 'plantId',
            as: 'plant',
            required: false 
        });
    };

    return GardeningLog;
};