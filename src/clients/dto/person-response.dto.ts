import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressResponseDto } from '../../common/dto/address.dto';

export class PersonResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '1020304050' }) nationalId!: string;
  @ApiProperty({ example: 'John' }) firstName!: string;
  @ApiProperty({ example: 'Doe' }) lastName!: string;
  @ApiProperty({ example: 'john.doe@example.com' }) email!: string;
  @ApiProperty({ example: '3001234567' }) phoneNumber!: string;
  @ApiProperty({ example: true }) enabled!: boolean;
  @ApiPropertyOptional({ type: AddressResponseDto })
  address?: AddressResponseDto;
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}
