import { Module } from '@nestjs/common';
import { StorageModule } from '@ube-hr/backend';
import { UsersService } from './users.service';

@Module({
  imports: [StorageModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
