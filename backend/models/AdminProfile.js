// models/AdminProfile.js
module.exports = (sequelize, DataTypes) => {
    const AdminProfile = sequelize.define("AdminProfile", {
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
            allowNull: true,
        },
        publicEmail: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isEmail: true,
            }
        },
        linkedInUrl: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true,
            }
        },
        department: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        subjectsTaught: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('subjectsTaught');
                try {
                    return rawValue ? JSON.parse(rawValue) : [];
                } catch (e) { return []; }
            },
            set(value) { 
                this.setDataValue('subjectsTaught', value ? JSON.stringify(value) : null);
            }
        },
        qualifications: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('qualifications');
                try {
                    return rawValue ? JSON.parse(rawValue) : [];
                } catch (e) { return []; }
            },
            set(value) {
                this.setDataValue('qualifications', value ? JSON.stringify(value) : null);
            }
        },
        researchInterests: {
            type: DataTypes.TEXT,
            allowNull: true,
            get() {
                const rawValue = this.getDataValue('researchInterests');
                try {
                    return rawValue ? JSON.parse(rawValue) : [];
                } catch (e) { return []; }
            },
            set(value) {
                this.setDataValue('researchInterests', value ? JSON.stringify(value) : null);
            }
        },
        publicationsUrl: { 
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isUrl: true,
            }
        },
        profileImageUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bioSummary: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        title: { // e.g., Professor, Head of Department, Dean
            type: DataTypes.STRING,
            allowNull: true,
        },
        yearsOfExperience: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                isInt: true,
                min: 0
            }
        }
    });

    AdminProfile.associate = (models) => {
        AdminProfile.belongsTo(models.User, {
            foreignKey: 'userId', 
            as: 'user',        
            onDelete: 'CASCADE'
        });
    };

    return AdminProfile;
};