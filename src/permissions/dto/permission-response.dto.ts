import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'vehicle:read' }) name!: string;
  @ApiPropertyOptional({ example: 'Allows viewing vehicles.' })
  description?: string;
}
