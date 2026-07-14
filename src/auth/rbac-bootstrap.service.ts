import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { reconcileRbacAndAdmin, type AdminSeedConfig } from './rbac-seed.util';

@Injectable()
export class RbacBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const admin = this.configService.get<AdminSeedConfig>('admin')!;
    await reconcileRbacAndAdmin(this.prisma, admin, (message) =>
      this.logger.warn(message),
    );
  }
}
