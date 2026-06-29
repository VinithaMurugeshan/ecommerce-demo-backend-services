import { Response } from "express";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Standard success envelope. */
export function ok<T>(res: Response, data: T, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

/** Success envelope with pagination metadata. */
export function paginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  statusCode = 200
) {
  return res.status(statusCode).json({ success: true, data, meta });
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
