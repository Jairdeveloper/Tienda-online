import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('true'),
  CORS_ORIGIN: Joi.string().allow('').default(''),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('log'),
  SWAGGER_ENABLED: Joi.string().valid('true', 'false', '1', '0').default('true'),
  SWAGGER_PATH: Joi.string().default('docs'),
  SWAGGER_TITLE: Joi.string().default('Tienda API'),
  SWAGGER_DESCRIPTION: Joi.string().default('Backend base tecnica'),
  SWAGGER_VERSION: Joi.string().default('1.0.0'),
  JWT_SECRET: Joi.string().min(8).required(),
  JWT_ACCESS_TTL: Joi.number().integer().positive().default(900),
  JWT_REFRESH_TTL: Joi.number().integer().positive().default(604800),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).required(),
  WEBHOOK_SECRET: Joi.string().min(16).when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().min(16).default('dev-webhook-secret-change-in-production'),
  }),
});
