const { Sequelize } = require('sequelize');
const sequelize = require('../../config/config');

const db = {
  sequelize,
  Sequelize
};

// ============================================================================
// MODELOS DE UBICACIÓN Y GEOGRAFÍA
// ============================================================================
db.Country = require('../../modules/kyc/models/country.model')(sequelize);
db.Department = require('../../modules/kyc/models/department.model')(sequelize);
db.City = require('../../modules/kyc/models/city.model')(sequelize);
db.PhonePrefix = require('../../modules/kyc/models/phone-prefix.model')(sequelize);

// ============================================================================
// MODELOS DE CATÁLOGOS Y CONFIGURACIÓN
// ============================================================================
db.Gender = require('../../modules/kyc/models/gender.model')(sequelize);
db.Role = require('../../modules/kyc/models/role.model')(sequelize);
db.AvatarTheme = require('../../modules/kyc/models/avatar-theme.model')(sequelize);
db.Avatar = require('../../modules/kyc/models/avatar.model')(sequelize);

// ============================================================================
// MODELOS DE PERSONAS Y USUARIOS
// ============================================================================
db.Person = require('../../modules/kyc/models/person.model')(sequelize);
db.PersonContact = require('../../modules/kyc/models/person-contact.model')(sequelize);
db.PersonLocation = require('../../modules/kyc/models/person-location.model')(sequelize);
db.User = require('../../modules/kyc/models/user.model')(sequelize);

// ============================================================================
// MODELOS DE AUTENTICACIÓN Y SEGURIDAD
// ============================================================================
db.VerificationCode = require('../../modules/kyc/models/verification-code.model')(sequelize);
db.UserLoginAttempt = require('../../modules/kyc/models/user-login-attempt.model')(sequelize);
db.ResetCredential = require('../../modules/kyc/models/reset-credential.model')(sequelize);
db.UserChangeLog = require('../../modules/kyc/models/user-change-log.model')(sequelize);
db.UserTrustedDevice = require('../../modules/kyc/models/user-trusted-device.model')(sequelize);

// ============================================================================
// MODELOS DE NOTIFICACIONES
// ============================================================================
db.NotificationType = require('../../modules/notification/models/notification-type.model')(sequelize);
db.UserNotificationPreference = require('../../modules/notification/models/user-notification-preference.model')(sequelize);
db.Notification = require('../../modules/notification/models/notification.model')(sequelize);
db.GlobalNotification = require('../../modules/notification/models/global-notification.model')(sequelize);
db.GlobalNotificationRead = require('../../modules/notification/models/global-notification-read.model')(sequelize);
db.UserPushToken = require('../../modules/notification/models/user-push-token.model')(sequelize);

// ============================================================================
// CONFIGURACIÓN DE ASOCIACIONES
// ============================================================================
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;