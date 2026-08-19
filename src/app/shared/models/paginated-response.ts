export interface PaginatedResponse<T> {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    pageCount: number; // Based on your JSON, this represents the total item count
    hasPrevious: boolean;
    hasNext: boolean;
    data: T[];
}