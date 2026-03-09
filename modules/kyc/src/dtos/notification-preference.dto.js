'use strict';

/**
 * NotificationPreference DTOs
 * Cubre: getPreferences, updateGlobalPreference, updateTypePreference,
 *        deleteTypePreference, batchUpdateTypePreferences
 *
 * No requiere components.dto.js ya que estas entidades son propias
 * del módulo de notificaciones y no comparten estructura con Person/User.
 */

// ============================================================
// GET
// ============================================================

class NotificationPreferenceDTO {
  constructor(preference) {
    this.id                   = preference.id;
    this.userId               = preference.user_id;
    this.notificationTypeCode = preference.notification_type_code || null; // null = preferencia global
    this.allowPush            = preference.allow_push;
    this.allowEmail           = preference.allow_email;
    this.quietHoursStart      = preference.quiet_hours_start || null;
    this.quietHoursEnd        = preference.quiet_hours_end   || null;
    this.updatedAt            = preference.updated_at;
  }
}

class NotificationPreferenceListDTO {
  constructor(preferences) {
    // Separar global de las específicas por tipo para mayor claridad
    const global = preferences.find(p => p.notification_type_code === null);
    const byType = preferences.filter(p => p.notification_type_code !== null);

    this.global  = global ? new NotificationPreferenceDTO(global) : null;
    this.byType  = byType.map(p => new NotificationPreferenceDTO(p));
    this.total   = preferences.length;
  }
}

// ============================================================
// UPDATE RESPONSES
// ============================================================

class UpdateGlobalPreferenceResponseDTO {
  constructor(preference) {
    this.id              = preference.id;
    this.allowPush       = preference.allow_push;
    this.allowEmail      = preference.allow_email;
    this.quietHoursStart = preference.quiet_hours_start || null;
    this.quietHoursEnd   = preference.quiet_hours_end   || null;
    this.updatedAt       = preference.updated_at;
  }
}

class UpdateTypePreferenceResponseDTO {
  constructor(preference) {
    this.id                   = preference.id;
    this.notificationTypeCode = preference.notification_type_code;
    this.allowPush            = preference.allow_push;
    this.allowEmail           = preference.allow_email;
    this.updatedAt            = preference.updated_at;
  }
}

class BatchUpdateResponseDTO {
  constructor(preferences) {
    this.updated = preferences.map(p => new UpdateTypePreferenceResponseDTO(p));
    this.count   = preferences.length;
  }
}

module.exports = {
  NotificationPreferenceDTO,
  NotificationPreferenceListDTO,
  UpdateGlobalPreferenceResponseDTO,
  UpdateTypePreferenceResponseDTO,
  BatchUpdateResponseDTO,
};
