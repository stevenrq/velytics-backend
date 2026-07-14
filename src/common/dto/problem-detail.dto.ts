import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProblemDetailDto {
  @ApiProperty({ example: 'about:blank' })
  type!: string;

  @ApiProperty({ example: 'Invalid request' })
  title!: string;

  @ApiProperty({ example: 400 })
  status!: number;

  @ApiProperty({ example: 'The request contains invalid data.' })
  detail!: string;

  @ApiProperty({ example: '/api/v1/persons' })
  instance!: string;

  @ApiPropertyOptional({
    description: 'Per-field validation error map.',
    example: { email: 'The email field must be a valid email address.' },
  })
  errors?: Record<string, string>;
}
