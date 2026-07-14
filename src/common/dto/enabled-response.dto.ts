import { ApiProperty } from '@nestjs/swagger';

export class EnabledResponseDto {
  @ApiProperty({ example: true })
  enabled!: boolean;
}
