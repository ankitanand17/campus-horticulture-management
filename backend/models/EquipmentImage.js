// models/EquipmentImage.js
module.exports = (sequelize, DataTypes) => {
    const EquipmentImage = sequelize.define("EquipmentImage", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Equipment name cannot be empty." }
            }
        },
        imageUrl: {
            type: DataTypes.STRING,
            allowNull: false, 
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        addedByUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    });

    EquipmentImage.associate = (models) => {
        EquipmentImage.belongsTo(models.User, {
            foreignKey: 'addedByUserId',
            as: 'adder'
        });
    };

    return EquipmentImage;
};