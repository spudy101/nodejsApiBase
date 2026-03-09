const productAuditLogSchemas = {
  ProductAuditLog: {
    type: 'object',
    required: ['audit_id', 'product_loan_id', 'action_type', 'new_version', 'created_at'],
    properties: {
      audit_id: {$ref: '#/components/schemas/UUID'},
      product_loan_id: {$ref: '#/components/schemas/UUID'},
      action_type: {type: 'string', enum: ['created', 'updated', 'activated', 'deactivated', 'version_increment'], example: 'updated'},
      previous_version: {type: 'integer', nullable: true},
      new_version: {type: 'integer'},
      changed_fields: {type: 'object'},
      performed_by: {type: 'object', properties: {user_id: {$ref: '#/components/schemas/UUID'}, full_name: {type: 'string'}}},
      change_request: {type: 'object', nullable: true},
      audit_notes: {type: 'string', nullable: true},
      created_at: {$ref: '#/components/schemas/Timestamp'}
    }
  },
  ProductAuditLogStatsResponse: {
    allOf: [{$ref: '#/components/schemas/SuccessResponse'}, {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            product_loan_id: {$ref: '#/components/schemas/UUID'},
            total_logs: {type: 'integer'},
            by_action_type: {type: 'object'},
            last_change: {type: 'object'}
          }
        }
      }
    }]
  }
};
module.exports = productAuditLogSchemas;