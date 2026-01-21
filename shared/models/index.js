const { Sequelize } = require('sequelize');
const sequelize = require('../../config/config');

const db = {
  sequelize,
  Sequelize
};

// Importar modelos
db.Country = require('./country.model')(sequelize);
db.Department = require('./department.model')(sequelize);
db.PhonePrefix = require('./phonePrefix.model')(sequelize);
db.City = require('./city.model')(sequelize);
db.Gender = require('./gender.model')(sequelize);
db.Role = require('./role.model')(sequelize);
db.AvatarTheme = require('./avatarTheme.model')(sequelize);
db.Avatar = require('./avatar.model')(sequelize);
db.SocialNetworkProvider = require('./socialNetworkProvider.model')(sequelize);
db.Person = require('./person.model')(sequelize);
db.PersonContact = require('./personContact.model')(sequelize);
db.PersonLocation = require('./personLocation.model')(sequelize);
db.PersonSocialNetwork = require('./personSocialNetwork.model')(sequelize);
db.User = require('./user.model')(sequelize);
db.VerificationCode = require('./verificationCode.model')(sequelize);
db.UserLoginAttempt = require('./userLoginAttempt.model')(sequelize);

db.NotificationType = require('./notificationType.model')(sequelize);
db.UserNotificationPreference = require('./userNotificationPreference.model')(sequelize);
db.Notification = require('./notification.model')(sequelize);
db.GlobalNotification = require('./globalNotification.model')(sequelize);
db.GlobalNotificationRead = require('./globalNotificationRead.model')(sequelize);
db.UserPushToken = require('./userPushToken.model')(sequelize); 
db.ResetCredentials = require('./resetCredentials.model')(sequelize);
db.UserChangeLog = require('./userChangeLog.model')(sequelize);

db.IdentityValidation = require('../../modules/client/models/identityValidation.model')(sequelize);

// Configurar asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;