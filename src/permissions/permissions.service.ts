import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionResponseDto } from './dto/permission-response.dto';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(): Promise<PermissionResponseDto[]> {
    const lang = I18nContext.current()?.lang ?? 'es';
    const permissions = await this.prisma.permission.findMany({
      orderBy: { id: 'asc' },
    });
    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      description: this.describe(permission.name, permission.description, lang),
    }));
  }

  /** Localizes the catalog description, falling back to the stored English text. */
  private describe(
    name: string,
    stored: string | null,
    lang: string,
  ): string | undefined {
    const key = `permissions.catalog.${name}`;
    const translated = this.i18n.translate<string, string>(key, { lang });
    // I18nService returns the key path verbatim when it is missing.
    if (translated && translated !== key) {
      return translated;
    }
    return stored ?? undefined;
  }
}
