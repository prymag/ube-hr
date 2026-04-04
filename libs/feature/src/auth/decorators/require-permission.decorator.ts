import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions';

export const PERMISSION_KEY = 'permissions';

/** Require ALL of the listed permissions. */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
