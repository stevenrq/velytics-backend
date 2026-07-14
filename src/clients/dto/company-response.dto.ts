import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressResponseDto } from '../../common/dto/address.dto';

export class CompanyResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '9001234567' }) taxId!: string;
  @ApiProperty({ example: 'Valley Motors Inc.' }) companyName!: string;
  @ApiProperty({ example: 'contact@valleymotors.com' }) email!: string;
  @ApiProperty({ example: '3011234567' }) phoneNumber!: string;
  @ApiProperty({ example: true }) enabled!: boolean;
  @ApiPropertyOptional({ type: AddressResponseDto })
  address?: AddressResponseDto;
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}
