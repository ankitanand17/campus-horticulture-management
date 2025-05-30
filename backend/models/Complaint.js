// models/Complaint.js
module.exports = (sequelize, DataTypes) => {
    const Complaint = sequelize.define("Complaint", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        complaintText: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: { msg: "Complaint details cannot be empty." },
                len: { args: [15, 3000], msg: "Complaint should be between 15 and 3000 characters." }
            }
        },
        category: { // e.g., "Maintenance", "Safety", "Horticulture Issue", "Harassment", "Other"
            type: DataTypes.STRING,
            allowNull: true,
        },
        locationDescription: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('new', 'pending_review', 'under_investigation', 'resolved', 'closed', 'rejected'),
            defaultValue: 'new',
            allowNull: false,
        },
        priority: { // Optional: "low", "medium", "high"
            type: DataTypes.ENUM('low', 'medium', 'high'),
            defaultValue: 'medium',
            allowNull: true,
        },
        submittedByUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE'
        },
        // Optional: For tracking who is handling/assigned the complaint
        assignedToUserId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'Users', key: 'id' }, 
            onDelete: 'SET NULL'
        },
        resolutionDetails: { // Notes on how the complaint was resolved
            type: DataTypes.TEXT,
            allowNull: true,
        },
    });

    Complaint.associate = (models) => {
        Complaint.belongsTo(models.User, {
            foreignKey: 'submittedByUserId',
            as: 'complainant'
        });
        Complaint.belongsTo(models.User, {
            foreignKey: 'assignedToUserId',
            as: 'assignee',
            required: false
        });
    };

    return Complaint;
};