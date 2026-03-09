// config/swagger/schemas/index.js
/**
 * Centralizar todos los schemas
 * Exporta los schemas de forma plana para que puedan ser referenciados con $ref
 */

// Client Schemas
const authClientSchemas = require('../modules/client/kyc/schemas/auth.schemas');
const sendVerificationClientSchemas = require('../modules/client/kyc/schemas/sendVerification.schemas');
const zapSignClientSchemas = require('../modules/client/kyc/schemas/zapSign.schemas');
const profileCompletenessClientSchemas = require('../modules/client/kyc/schemas/profileCompleteness.schemas');
const cosignerClientSchemas = require('../modules/client/kyc/schemas/cosigner.schemas');

const productLoanClientSchemas = require('../modules/client/loan/schemas/productLoan.schemas');
const loanOfferClientSchemas = require('../modules/client/loan/schemas/loanOffer.schemas');

// Admin Schemas
const personAdminSchemas = require('../modules/admin/kyc/schemas/person.schemas');
const notificationTypeAdminSchemas = require('../modules/admin/kyc/schemas/notificationType.schemas');
const changeLogAdminSchemas = require('../modules/admin/kyc/schemas/changeLog.schemas');

const changerequestAdminSchemas = require('../modules/admin/loan/schemas/changerequest.schemas');
const productLoanAdminSchemas = require('../modules/admin/loan/schemas/productLoan.schemas');
const productauditlogAdminSchemas = require('../modules/admin/loan/schemas/productauditlog.schemas');
const systemGlobalConfigAdminSchemas = require('../modules/admin/loan/schemas/systemGlobalConfig.schemas');

// Shared Schemas
const authSharedSchemas = require('../shared/kyc/schemas/auth.schemas');
const MFASharedSchemas = require('../shared/kyc/schemas/MFA.schemas');
const notificationPreferenceSharedSchemas = require('../shared/kyc/schemas/notificationPreference.schemas');
const profileSharedSchemas = require('../shared/kyc/schemas/profile.schemas');

const maintainersSharedSchemas = require('../shared/common/schemas/maintainers.schemas');

const notificationSharedSchemas = require('../shared/notifications/schemas/notification.schemas');

const employmentRecordsSchemas = require('./kyc/employmentRecords.schemas');
const screeningSchemas = require('./kyc/screening.schemas');
const taxResidencySchemas = require('./kyc/taxResidency.schemas');
const commonPersonSchemas = require('./kyc/commonPerson.schema')
const institutionalSchemas = require('./kyc/institutional.schemas');

const loanApplicationReviewSchemas = require('./loan/loanApplicationReview.schemas');
const loanBaseSchemas = require('./loan/loanBase.schemas');
const contractsSchemas = require('./loan/contracts.schemas');
const loanSchemas = require('./loan/loan.schemas');

const commonSchemas = require('./common.schemas');

const getAllSchemas = () => {
  return {
    // Common Schemas
    ...commonSchemas,
    
    ...loanApplicationReviewSchemas,
    ...loanBaseSchemas,

    ...screeningSchemas,
    ...employmentRecordsSchemas,
    ...taxResidencySchemas,
    ...commonPersonSchemas,
    ...institutionalSchemas,
    
    // Client Schemas
    ...authClientSchemas,
    ...sendVerificationClientSchemas,
    ...zapSignClientSchemas,
    ...profileCompletenessClientSchemas,
    ...cosignerClientSchemas,

    ...productLoanClientSchemas,
    ...loanOfferClientSchemas,
    ...contractsSchemas,
    ...loanSchemas,

    // Shared Schemas
    ...authSharedSchemas,
    ...maintainersSharedSchemas,
    ...MFASharedSchemas,
    ...notificationPreferenceSharedSchemas,
    ...profileSharedSchemas,
    ...notificationSharedSchemas,

    // Admin Schemas
    ...personAdminSchemas,
    ...notificationTypeAdminSchemas,
    ...changeLogAdminSchemas,

    ...changerequestAdminSchemas,
    ...productLoanAdminSchemas,
    ...productauditlogAdminSchemas,
    ...systemGlobalConfigAdminSchemas,
  };
};

module.exports = getAllSchemas;