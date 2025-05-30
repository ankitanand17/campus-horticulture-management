// models/Feedback.js
module.exports = (sequelize, DataTypes) => {
    const Feedback = sequelize.define("Feedback", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        feedbackText: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Feedback text cannot be empty."
                },
                len: {
                    args: [10, 2000], // Min 10 chars, Max 2000 chars
                    msg: "Feedback should be between 10 and 2000 characters."
                }
            }
        },
        rating: { // Optional: e.g., 1-5 stars
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isInt: true,
                min: 1,
                max: 5
            }
        },
        category: { // Optional: e.g., "Website", "Event", "Horticulture", "General"
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('new', 'reviewed', 'in_progress', 'resolved', 'archived'),
            defaultValue: 'new',
            allowNull: false,
        },
        submittedByUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE' // If user is deleted, their feedback is also deleted
        },
        // Optional: Admin who reviewed/handled it
        resolvedByAdminId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        adminNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    });

    Feedback.associate = (models) => {
        Feedback.belongsTo(models.User, {
            foreignKey: 'submittedByUserId',
            as: 'submitter'
        });
        Feedback.belongsTo(models.User, {
            foreignKey: 'resolvedByAdminId',
            as: 'resolver',
            required: false
        });
    };

    return Feedback;
};