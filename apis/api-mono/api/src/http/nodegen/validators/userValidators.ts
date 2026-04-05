import { Joi } from 'celebrate';

export default {
  userCurrentGet: {},

  userCurrentPut: {
    body: Joi.object({
      email: Joi.string().required(),
      firstName: Joi.string().max(100).required(),
      lastName: Joi.string().max(100).required(),
      displayName: Joi.string().allow('').max(200).allow(null),
    }),
  },
};
