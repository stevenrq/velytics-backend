import { PageResponseDto } from '../dto/page-response.dto';

interface PaginatableDelegate<T> {
  count(args: { where?: any }): Promise<number>;
  findMany(args: {
    where?: any;
    skip: number;
    take: number;
    orderBy?: any;
    include?: any;
  }): Promise<T[]>;
}

export interface PaginateParams {
  page: number;
  limit: number;
  where?: unknown;
  orderBy?: unknown;
  include?: unknown;
}

export async function paginate<T>(
  delegate: PaginatableDelegate<T>,
  { page, limit, where, orderBy, include }: PaginateParams,
): Promise<PageResponseDto<T>> {
  const skip = (page - 1) * limit;

  const [totalItems, data] = await Promise.all([
    delegate.count({ where }),
    delegate.findMany({ where, skip, take: limit, orderBy, include }),
  ]);

  return new PageResponseDto(data, page, limit, totalItems);
}
