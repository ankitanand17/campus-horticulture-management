// models/GardenerProfile.js
module.exports = (sequelize, DataTypes) => {
    const GardenerProfile = sequelize.define("GardenerProfile", {
        userId: { 
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE',
            allowNull: false
        },
        contactNumber: {
            type: DataTypes.STRING,
            allowNull: false, 
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        dateOfJoining: {
            type: DataTypes.DATEONLY, // Just the date, no time
            allowNull: true,
        },
        profileImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        specialization: { // e.g., "Rose care", "Pest control", "Landscaping"
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

    GardenerProfile.associate = (models) => {
        GardenerProfile.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user',
            onDelete: 'CASCADE'
        });
    };

    return GardenerProfile;
};