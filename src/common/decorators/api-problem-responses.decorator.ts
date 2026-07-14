import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ProblemDetailDto } from '../dto/problem-detail.dto';

// English labels for the Swagger response `description` (developer-facing docs).
const DESCRIPTIONS: Record<number, string> = {
  400: 'Invalid request',
  401: 'Unauthenticated',
  403: 'Forbidden',
  404: 'Resource not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
  429: 'Too many requests',
  500: 'Internal server error',
};

// Titles used only inside the example payloads below. The API is localized
// (i18n); these English examples illustrate the response shape.
const TITLES: Record<number, string> = {
  400: 'Invalid request',
  401: 'Unauthenticated',
  403: 'Forbidden',
  404: 'Resource not found',
  409: 'Conflict',
  422: 'Unprocessable entity',
  429: 'Too many requests',
  500: 'Internal server error',
};

const EXAMPLES: Record<number, Record<string, unknown>> = {
  400: {
    type: 'about:blank',
    title: TITLES[400],
    status: 400,
    detail: 'The request contains invalid data.',
    instance: '/api/v1/persons',
    errors: { email: 'The email field must be a valid email address.' },
  },
  401: {
    type: 'about:blank',
    title: TITLES[401],
    status: 401,
    detail: 'You must sign in to access this resource.',
    instance: '/api/v1/persons',
  },
  403: {
    type: 'about:blank',
    title: TITLES[403],
    status: 403,
    detail: 'You do not have permission to perform this action.',
    instance: '/api/v1/persons',
  },
  404: {
    type: 'about:blank',
    title: TITLES[404],
    status: 404,
    detail: 'The requested resource does not exist.',
    instance: '/api/v1/persons/999',
  },
  409: {
    type: 'about:blank',
    title: TITLES[409],
    status: 409,
    detail: 'A record with the same value already exists in: email.',
    instance: '/api/v1/persons',
  },
};

function defaultExample(status: number): Record<string, unknown> {
  return (
    EXAMPLES[status] ?? {
      type: 'about:blank',
      title: TITLES[status] ?? 'Error',
      status,
      detail: 'An error occurred while processing the request.',
      instance: '/api/v1/resource',
    }
  );
}

/**
 * Documents one or more RFC-7807 error responses emitted by ProblemDetailFilter,
 * attaching a per-status example of the response body.
 */
export function ApiProblemResponses(...statuses: number[]) {
  const responseDecorators = statuses.map((status) =>
    ApiResponse({
      status,
      description: DESCRIPTIONS[status] ?? 'Error',
      schema: {
        allOf: [{ $ref: getSchemaPath(ProblemDetailDto) }],
        example: defaultExample(status),
      },
    }),
  );

  return applyDecorators(
    ApiExtraModels(ProblemDetailDto),
    ...responseDecorators,
  );
}

export const ApiAuthErrors = () => ApiProblemResponses(401, 403);
export const ApiBadRequest = () => ApiProblemResponses(400);
export const ApiNotFound = () => ApiProblemResponses(404);
export const ApiConflict = () => ApiProblemResponses(409);
