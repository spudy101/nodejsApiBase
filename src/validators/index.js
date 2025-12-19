const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('./authValidator');

const {
  createProductValidation,
  updateProductValidation,
  getProductByIdValidation,
  deleteProductValidation,
  listProductsValidation,
  updateStockValidation
} = require('./productValidator');

const {
  uuidParamValidation,
  paginationValidation,
  sortValidation,
  searchValidation,
  dateRangeValidation
} = require('./commonValidator');

module.exports = {
  // Auth validators
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,

  // Product validators
  createProductValidation,
  updateProductValidation,
  getProductByIdValidation,
  deleteProductValidation,
  listProductsValidation,
  updateStockValidation,

  // Common validators
  uuidParamValidation,
  paginationValidation,
  sortValidation,
  searchValidation,
  dateRangeValidation
};