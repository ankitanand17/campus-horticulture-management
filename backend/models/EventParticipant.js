// models/EventParticipant.js
module.exports = (sequelize, DataTypes) => {
    const EventParticipant = sequelize.define("EventParticipant",  {
        eventId: {
            type: DataTypes.INTEGER,
            primaryKey: true, 
            references: {
                model: sequelize.models.Event || "Events",
                key: "id"
            },
            onDelete: "CASCADE"
        },
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: {
                model: sequelize.models.User || "Users",
                key: "id"
            },
            onDelete: "CASCADE"
        }
    }, {
        timestamps: false,
    });

    return EventParticipant;
};