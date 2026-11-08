import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { can, type Feature, type Permission } from '@platform/shared';
import type { AuthUser, RequestWithUser } from './auth-user.js';

const PERMISSION_KEY = 'auth:permission';
const FEATURE_KEY = 'auth:feature';

/** Role-based check, see PERMISSIONS in @platform/shared. */
export const RequirePermission = (permission: Permission) => SetMetadata(PERMISSION_KEY, permission);

/** Plan-based check: the tenant's plan must include this module. */
export const RequireFeature = (feature: Feature) => SetMetadata(FEATURE_KEY, feature);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest<RequestWithUser>().authUser;
    if (!user) throw new UnauthorizedException();

    const targets = [ctx.getHandler(), ctx.getClass()];
    const feature = this.reflector.getAllAndOverride<Feature | undefined>(FEATURE_KEY, targets);
    if (feature && !user.features.includes(feature)) {
      throw new ForbiddenException(`The ${feature} module is not part of this plan`);
    }
    const permission = this.reflector.getAllAndOverride<Permission | undefined>(PERMISSION_KEY, targets);
    if (permission && !can(user.role, permission)) throw new ForbiddenException();
    return true;
  }
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest<RequestWithUser>().authUser!,
);
