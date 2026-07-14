import { ApiProperty } from '@nestjs/swagger';

export class CountResponseDto {
  @ApiProperty({ example: 42 }) total!: number;
  @ApiProperty({ example: 35 }) active!: number;
  @ApiProperty({ example: 7 }) inactive!: number;
}
