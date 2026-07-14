import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddressResponseDto } from '../../common/dto/address.dto';

export class UserResponseDto {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: '1020304050' }) nationalId!: string;
  @ApiProperty({ example: 'Jane' }) firstName!: string;
  @ApiProperty({ example: 'Doe' }) lastName!: string;
  @ApiProperty({ example: 'jane.doe@velytics.com' }) email!: string;
  @ApiProperty({ example: '3009876543' }) phoneNumber!: string;
  @ApiProperty({ example: 'jdoe' }) username!: string;
  @ApiProperty({ example: true }) enabled!: boolean;
  @ApiPropertyOptional({ type: AddressResponseDto })
  address?: AddressResponseDto;
  @ApiProperty({ type: [String], example: ['ADMIN'] }) roles!: string[];
  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-06-15T09:30:00.000Z' }) updatedAt!: Date;
}

export class UserCountDto {
  @ApiProperty({ example: 12 }) totalUsers!: number;
  @ApiProperty({ example: 10 }) activeUsers!: number;
  @ApiProperty({ example: 2 }) inactiveUsers!: number;
}
