// models/StudentProfile.js
module.exports = (sequelize, DataTypes) => {
    const StudentProfile = sequelize.define("StudentProfile", {
        userId: { // Foreign Key to User table, also Primary Key for this table
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: 'Users', // Name of the Users table
                key: 'id'
            },
            onDelete: 'CASCADE',
            allowNull: false
        },
        contactNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        department: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        semester: { // e.g., "Spring 2024", "Fall 2023" or just a number
            type: DataTypes.STRING, // Or DataTypes.INTEGER if it's just a number
            allowNull: true,
        },
        yearOfJoining: {
            type: DataTypes.INTEGER, // e.g., 2021
            allowNull: true,
            validate: {
                isInt: true,
                min: 1900, // Reasonable minimum
                max: new Date().getFullYear() + 5 // Reasonable maximum
            }
        },
        profileImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // Optional: address, emergencyContact, etc.
        bio: { // A short bio if students want to add one
            type: DataTypes.TEXT,
            allowNull: true,
        }
        // Timestamps (createdAt, updatedAt) added by default
    });

    StudentProfile.associate = (models) => {
        StudentProfile.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'user', // Alias to access User model from StudentProfile
            onDelete: 'CASCADE'
        });
    };

    return StudentProfile;
};