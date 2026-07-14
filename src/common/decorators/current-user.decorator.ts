import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import '../../auth/types/request-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user;
  },
);
