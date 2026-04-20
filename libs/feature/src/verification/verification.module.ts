import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { PrismaService } from '@ube-hr/backend';

@Module({
  providers: [VerificationService, PrismaService],
  exports: [VerificationService],
})
export class VerificationModule {}
