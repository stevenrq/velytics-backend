import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PasswordPolicyService } from './password-policy.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, PasswordPolicyService],
  exports: [UsersService],
})
export class UsersModule {}
