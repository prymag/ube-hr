import { Global, Module } from '@nestjs/common';
import { BackendCacheModule } from '@ube-hr/backend';
import { PermissionsService } from './permissions.service';

@Global()
@Module({
  imports: [BackendCacheModule],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
