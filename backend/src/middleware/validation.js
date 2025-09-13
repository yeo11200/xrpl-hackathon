const Joi = require("joi");
const xrpl = require("xrpl");

const validateRequest = (schema) => {
  return (req, res, next) => {
    const dataToValidate = { ...req.params, ...req.body, ...req.query };
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,    // 모든 에러를 다 보여줌 (첫 번째에서 멈추지 않음)
      allowUnknown: true,   // 스키마에 없는 필드도 허용
      stripUnknown: true    // 허용하되 결과에서는 제거
    });

    if (error) {
            return res.status(400).json({
        success: false,
        error: "Validation Error",
        message: error.details[0].message,
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// Validation schemas
const schemas = {
  // 📋 기본 계정 관리
  createAccount: Joi.object({
    nickname: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[A-Za-z0-9가-힣]+$/)
    .required()
    .messages({
      'string.empty': '닉네임은 필수입니다',
      'string.min': '닉네임은 최소 2자 이상이어야 합니다',
      'string.max': '닉네임은 최대 50자까지 가능합니다',
      'string.pattern.base': '닉네임은 한글/영문/숫자만 가능합니다'
    })
  }),
  
  getAccountInfo: Joi.object({
    address: Joi.string().required()
  }),
  
  // 💰 XRP 송금 관련
  createWallet: Joi.object({
    fund: Joi.boolean().default(false)
  }),
  
  sendPayment: Joi.object({
    toAddress: Joi.string().required(),
    amount: Joi.number().positive().required(),
    fromWalletSeed: Joi.string().required()
  }),
  
  sendPaymentFromAccount: Joi.object({
    toAddress: Joi.string()
    .required()
    .custom((value, helpers) => {
      if (!xrpl.isValidClassicAddress(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid': '유효한 XRPL 주소를 입력해주세요'
    }),
    amount: Joi.number()
    .positive()
    .precision(6)
    .required()
    .messages({
      'number.positive': '송금액은 0보다 커야 합니다',
      'number.precision': 'XRP는 소수점 6자리까지만 가능합니다'
    })
  }),
  
  // 📊 트랜잭션 조회
  getTransactions: {
    params: Joi.object({
      address: Joi.string().required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  },
  
  getPaymentHistory: Joi.object({
    address: Joi.string().required(),
    type: Joi.string()
    .valid("all", "sent", "received", "pending")
    .default("all"),
  })
  // createPaymentRequest: Joi.object({
  //   amount: Joi.number().positive().required(),
  //   description: Joi.string().max(500).required(),
  //   merchantAddress: Joi.string().required(),
  // }),
  
  // processPayment: Joi.object({
  //   paymentId: Joi.string().uuid().required(),
  //   customerWalletSeed: Joi.string().required(),
  //   customerAddress: Joi.string().required(),
  // }),
  
  // refundPayment: Joi.object({
  //   paymentId: Joi.string().uuid().required(),
  //   merchantWalletSeed: Joi.string().required(),
  // }),
};

module.exports = {
  validateRequest,
  schemas,
};
