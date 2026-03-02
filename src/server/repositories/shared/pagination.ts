import type { PaginatedResult, Pagination } from "@/types/pagination";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export type PaginationInput = Partial<Pagination>;

export function normalizePagination(input?: PaginationInput): Pagination {
  const page = Math.max(input?.page ?? DEFAULT_PAGE, 1);
  const pageSize = Math.min(Math.max(input?.pageSize ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  return {
    page,
    pageSize,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  pagination: Pagination,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
  };
}
