const Joi = require("joi");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      error.isJoi = true;
      return next(error);
    }
    next();
  };
};

// Validation schemas
const schemas = {
  createPaymentRequest: Joi.object({
    amount: Joi.number().positive().required(),
    description: Joi.string().max(500).required(),
    merchantAddress: Joi.string().required(),
  }),

  processPayment: Joi.object({
    paymentId: Joi.string().uuid().required(),
    customerWalletSeed: Joi.string().required(),
    customerAddress: Joi.string().required(),
  }),

  refundPayment: Joi.object({
    paymentId: Joi.string().uuid().required(),
    merchantWalletSeed: Joi.string().required(),
  }),

  createWallet: Joi.object({
    fund: Joi.boolean().default(false),
  }),

  sendPayment: Joi.object({
    toAddress: Joi.string().required(),
    amount: Joi.number().positive().required(),
    fromWalletSeed: Joi.string().required(),
  }),

  getAccountInfo: Joi.object({
    address: Joi.string().required(),
  }),

  getPaymentHistory: Joi.object({
    address: Joi.string().required(),
    type: Joi.string()
      .valid("all", "sent", "received", "pending")
      .default("all"),
  }),
};

module.exports = {
  validateRequest,
  schemas,
};
