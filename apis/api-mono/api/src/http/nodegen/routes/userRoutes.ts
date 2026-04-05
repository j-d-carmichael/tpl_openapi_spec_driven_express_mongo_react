import express from 'express';

import { celebrate } from 'celebrate';

import permissionMiddleware from '../middleware/permissionMiddleware';
import asyncValidationMiddleware from '../middleware/asyncValidationMiddleware';
import userValidators from '../validators/userValidators';
import UserDomain from '../../../domains/UserDomain';
import userTransformOutputs from '../transformOutputs/userTransformOutput';

export default function () {
  const router = Router();

  /**
   * Operation ID: userCurrentGet
   * Summary: Get current, from user
   *
   */

  router.get(
    '/current' /* x-raw-body on path not found: Format the body */,
    express.json({ limit: '50mb' }),
    /* x-permission on path found: Check permission of the incoming user */
    permissionMiddleware('apiUserCurrentRead'),

    /* x-async-validators on path found: Call an async validator function and throw an appropriate error */
    asyncValidationMiddleware(['companyCheck']),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await UserDomain.userCurrentGet(req),
        200,
        'application/json',
        userTransformOutputs.userCurrentGet
      );
    }
  );

  /**
   * Operation ID: userCurrentPut
   * Summary: Update a current, from user
   *
   */

  router.put(
    '/current' /* x-raw-body on path not found: Format the body */,
    express.json({ limit: '50mb' }),
    /* x-permission on path found: Check permission of the incoming user */
    permissionMiddleware('apiUserCurrentUpdate'),

    /* Validate the request data and return validation errors */
    celebrate(userValidators.userCurrentPut),

    /* x-async-validators on path found: Call an async validator function and throw an appropriate error */
    asyncValidationMiddleware(['companyCheck']),
    async (req: any, res: GenerateItExpressResponse) => {
      res.inferResponseType(
        await UserDomain.userCurrentPut(req.body, req),
        200,
        'application/json',
        userTransformOutputs.userCurrentPut
      );
    }
  );

  return router;
}
