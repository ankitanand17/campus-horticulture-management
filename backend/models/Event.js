module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define("Event", {
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        time: {
            type: DataTypes.STRING,
            allowNull: false
        },
        imageUrl: {
            type: DataTypes.STRING
        },
        completed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        participantCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    });

    Event.associate = (models) => {
        Event.belongsTo(models.User, {
            foreignKey: {
                name: "createdBy",
                allowNull: false,
            },
            as: "creator",
            onDelete: "CASCADE",
        });
    };

    return Event;
};