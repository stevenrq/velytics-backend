import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PageResponseDto } from '../dto/page-response.dto';

/**
 * Documents a paginated response, resolving the PageResponseDto<T> generic so
 * Swagger renders the concrete schema of `data` instead of the raw envelope.
 */
export function ApiPaginatedResponse<TModel extends Type<unknown>>(
  model: TModel,
  description = 'Paginated list.',
) {
  return applyDecorators(
    ApiExtraModels(PageResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PageResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
}
