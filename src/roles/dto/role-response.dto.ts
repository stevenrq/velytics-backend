import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'SALES_MANAGER' }) name!: string;
  @ApiPropertyOptional({ example: 'Vehicle sales manager.' })
  description?: string;
  @ApiProperty({
    type: [String],
    example: ['vehicle:read', 'purchase_sale:create'],
  })
  permissions!: string[];
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}
