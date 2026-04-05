import { User, UserCurrentPutPut } from '@/http/nodegen/interfaces';

import { UserDomainInterface } from '@/http/nodegen/domainInterfaces/UserDomainInterface';

import NodegenRequest from '../http/interfaces/NodegenRequest';

class UserDomain implements UserDomainInterface {
  public async userCurrentGet(req: NodegenRequest): Promise<User> {
    return {};
  }

  public async userCurrentPut(
    body: UserCurrentPutPut,
    req: NodegenRequest
  ): Promise<User> {
    return {};
  }
}

export default new UserDomain();
