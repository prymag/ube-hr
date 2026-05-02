import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { Permission } from '@ube-hr/shared';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissions?.length) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = req.user?.role;

    if (
      !role ||
      !(await this.permissionsService.hasPermissions(role, permissions))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
