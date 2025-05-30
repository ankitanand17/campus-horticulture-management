module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("User", {
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    role: {
      type: DataTypes.ENUM("student", "gardener", "admin"),
      allowNull: false,
      defaultValue: "student"
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  // User's one-to-one association with AdminProfile
  User.associate = (models) => { 
    User.hasOne(models.AdminProfile, { // Now 'models.AdminProfile' will be defined
      foreignKey: 'userId',
      as: 'adminProfile',
      onDelete: 'CASCADE'
    });
    User.hasOne(models.StudentProfile, {
      foreignKey: 'userId', // FK in StudentProfile model
      as: 'studentProfile', // Alias to access StudentProfile from User
      onDelete: 'CASCADE'   // If User is deleted, their StudentProfile is also deleted
    });
    // User's one-to-one association with GardenerProfile
    User.hasOne(models.GardenerProfile, {
      foreignKey: 'userId',
      as: 'gardenerProfile',
      onDelete: 'CASCADE'
    });
    // User's (as a gardener) one-to-many association with GardeningLogs
    User.hasMany(models.GardeningLog, {
      foreignKey: 'gardenerUserId',
      as: 'gardeningLogs', // Logs performed by this gardener
      onDelete: 'CASCADE'
    });

    // User's one-to-many association with Feedback they submitted
    User.hasMany(models.Feedback, {
        foreignKey: 'submittedByUserId',
        as: 'submittedFeedback',
        onDelete: 'CASCADE'
    });

    // User's (as an admin) one-to-many association with Feedback they resolved
    User.hasMany(models.Feedback, {
        foreignKey: 'resolvedByAdminId',
        as: 'resolvedFeedback',
        onDelete: 'SET NULL' // Or 'NO ACTION' depending on desired behavior
    });

    // User's one-to-many association with Complaints they submitted
    User.hasMany(models.Complaint, {
        foreignKey: 'submittedByUserId',
        as: 'submittedComplaints',
        onDelete: 'CASCADE'
    });

    // User's (as an assignee) one-to-many association with Complaints assigned to them
    User.hasMany(models.Complaint, {
        foreignKey: 'assignedToUserId',
        as: 'assignedComplaints',
        onDelete: 'SET NULL' // Or 'NO ACTION'
    });

    // User's one-to-many association with EquipmentImages they added
    User.hasMany(models.EquipmentImage, {
        foreignKey: 'addedByUserId',
        as: 'addedEquipmentImages',
        onDelete: 'CASCADE'
    });
  };
  return User;
};
