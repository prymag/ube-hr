import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { hasPermission, Permission } from '../permissions';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<Permission>(PERMISSION_KEY, context.getHandler());
    if (!permission) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.user?.role;
    if (!role || !hasPermission(role, permission)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
