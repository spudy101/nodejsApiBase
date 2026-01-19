class NotificationPreferenceDTO {
  constructor(preference) {
    this.user_notification_preference_id = preference.user_notification_preference_id;
    this.notification_type_code = preference.notification_type_code;
    this.allow_push = preference.allow_push;
    this.allow_email = preference.allow_email;
    this.quiet_hours_start = preference.quiet_hours_start;
    this.quiet_hours_end = preference.quiet_hours_end;
    
    // Si tiene relación con notification_type
    if (preference.notification_type) {
      this.notification_type = {
        code: preference.notification_type.code,
        name: preference.notification_type.name,
        // TODO: Agregar más columnas de NotificationType model si las necesitas
      };
    }
  }
}

class NotificationPreferenceListDTO {
  constructor(preferences) {
    this.preferences = preferences.map(p => new NotificationPreferenceDTO(p));
    this.total = preferences.length;
  }
}

class UpdateGlobalPreferenceResponseDTO {
  constructor(preference) {
    this.user_notification_preference_id = preference.user_notification_preference_id;
    this.notification_type_code = preference.notification_type_code;
    this.allow_push = preference.allow_push;
    this.allow_email = preference.allow_email;
    this.quiet_hours_start = preference.quiet_hours_start;
    this.quiet_hours_end = preference.quiet_hours_end;
  }
}

class UpdateTypePreferenceResponseDTO {
  constructor(preference) {
    this.user_notification_preference_id = preference.user_notification_preference_id;
    this.notification_type_code = preference.notification_type_code;
    this.allow_push = preference.allow_push;
    this.allow_email = preference.allow_email;
  }
}

class BatchUpdateResponseDTO {
  constructor(results) {
    this.updated = results.length;
    this.preferences = results.map(r => new NotificationPreferenceDTO(r));
  }
}

module.exports = {
  NotificationPreferenceDTO,
  NotificationPreferenceListDTO,
  UpdateGlobalPreferenceResponseDTO,
  UpdateTypePreferenceResponseDTO,
  BatchUpdateResponseDTO
};