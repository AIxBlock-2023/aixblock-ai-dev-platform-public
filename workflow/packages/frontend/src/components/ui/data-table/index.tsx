'use client';

import {
  flexRender,
  getCoreRowModel,
  ColumnDef as TanstackColumnDef,
  useReactTable,
} from '@tanstack/react-table';
import { t } from 'i18next';
import { size } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDeepCompareEffect } from 'react-use';
import { v4 as uuid } from 'uuid';
import { isNil, SeekPage } from 'workflow-shared';

import { Button } from '../button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import IconArrowLeftBold from '../svg/IconArrowLeftBold';
import IconArrowRightBold from '../svg/IconArrowRightBold';

import { DataTableBulkActions } from './data-table-bulk-actions';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFacetedFilter } from './data-table-options-filter';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableToolbar } from './data-table-toolbar';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataWithId = {
  id?: string;
};
export type RowDataWithActions<TData extends DataWithId> = TData & {
  delete: () => void;
  update: (payload: Partial<TData>) => void;
};

export const CURSOR_QUERY_PARAM = 'cursor';
export const LIMIT_QUERY_PARAM = 'limit';
export const PAGE_QUERY_PARAM = 'page';

export type DataTableFilter<Keys extends string> = {
  type: 'select' | 'input' | 'date';
  title: string;
  accessorKey: Keys;
  icon: React.ComponentType<{ className?: string }>;
  options: readonly {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
};

type DataTableAction<TData extends DataWithId> = (
  row: RowDataWithActions<TData>,
) => JSX.Element;

// Extend the ColumnDef type to include the notClickable property
type ColumnDef<TData, TValue> = TanstackColumnDef<TData, TValue> & {
  notClickable?: boolean;
};

interface DataTableProps<
  TData extends DataWithId,
  TValue,
  Keys extends string,
  F extends DataTableFilter<Keys>,
> {
  columns: ColumnDef<RowDataWithActions<TData>, TValue>[];
  page: SeekPage<TData> | undefined;
  onRowClick?: (
    row: RowDataWithActions<TData>,
    newWindow: boolean,
    e: React.MouseEvent<HTMLTableRowElement, MouseEvent>,
  ) => void;
  isLoading: boolean;
  filters?: F[];
  onSelectedRowsChange?: (rows: RowDataWithActions<TData>[]) => void;
  actions?: DataTableAction<TData>[];
  hidePagination?: boolean;
  bulkActions?: BulkAction<TData>[];
  emptyStateTextTitle: string;
  emptyStateTextDescription: string;
  emptyStateIcon: React.ReactNode;
}

export type BulkAction<TData extends DataWithId> = {
  render: (
    selectedRows: RowDataWithActions<TData>[],
    resetSelection: () => void,
  ) => React.ReactNode;
};

export function DataTable<
  TData extends DataWithId,
  TValue,
  Keys extends string,
  F extends DataTableFilter<Keys>,
>({
  columns: columnsInitial,
  page,
  onRowClick,
  filters = [] as F[],
  actions = [],
  isLoading,
  onSelectedRowsChange,
  hidePagination,
  bulkActions = [],
  emptyStateTextTitle,
  emptyStateTextDescription,
  emptyStateIcon,
}: DataTableProps<TData, TValue, Keys, F>) {
  const columns =
    actions.length > 0
      ? columnsInitial.concat([
          {
            accessorKey: '__actions',
            header: ({ column }) => (
              <DataTableColumnHeader column={column} title="" />
            ),
            cell: ({ row }) => {
              return (
                <div className="flex justify-end gap-4">
                  {actions.map((action, index) => {
                    return (
                      <React.Fragment key={index}>
                        {action(row.original)}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            },
          },
        ])
      : columnsInitial;

  const [searchParams, setSearchParams] = useSearchParams();
  const startingPage = searchParams.get(PAGE_QUERY_PARAM)
    ? parseInt(searchParams.get(PAGE_QUERY_PARAM) || '1')
    : 1;
  const startingLimit = searchParams.get(LIMIT_QUERY_PARAM)
    ? parseInt(searchParams.get(LIMIT_QUERY_PARAM) || '10')
    : 10;

  const [currentPage, setCurrentPage] = useState(startingPage - 1);
  const [currentLimit, setCurrentLimit] = useState(startingLimit);

  const enrichPageData = (data: TData[]) => {
    return data.map((row, index) => ({
      ...row,
      delete: () => {
        setDeletedRows((prevDeletedRows) => [...prevDeletedRows, row]);
      },
      update: (payload: Partial<TData>) => {
        setTableData((prevData) => {
          const newData = [...prevData];
          newData[index] = { ...newData[index], ...payload };
          return newData;
        });
      },
    }));
  };

  const [deletedRows, setDeletedRows] = useState<TData[]>([]);
  const [tableData, setTableData] = useState<RowDataWithActions<TData>[]>(
    enrichPageData(page?.data ?? []),
  );

  useDeepCompareEffect(() => {
    setTableData(enrichPageData(page?.data ?? []));
  }, [page?.data]);

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getRowId: () => uuid(),
    pageCount: page?.pageCount,
  });

  useEffect(() => {
    filters?.forEach((filter) => {
      const column = table.getColumn(filter.accessorKey);
      const values = searchParams.getAll(filter.accessorKey);
      if (column && values) {
        column.setFilterValue(values);
      }
    });
  }, []);

  useDeepCompareEffect(() => {
    onSelectedRowsChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original),
    );
  }, [table.getSelectedRowModel().rows]);

  useEffect(() => {
    setTableData(
      tableData.filter(
        (row) => !deletedRows.some((deletedRow) => deletedRow.id === row.id),
      ),
    );
  }, [deletedRows]);

  const resetSelection = () => {
    table.toggleAllRowsSelected(false);
  };

  const handleChangedFilter = useCallback(() => {
    setCurrentPage(0);
  }, [setCurrentPage]);

  const handleGoPage = (page: number, limit: number) => {
    setCurrentPage(page);
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', (page + 1).toString());
        newParams.set('limit', `${limit}`);
        return newParams;
      },
      { replace: true },
    );
  };

  return (
    <div>
      {((filters && filters.length > 0) || bulkActions.length > 0) && (
        <DataTableToolbar>
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {filters &&
                filters.map((filter) => (
                  <DataTableFacetedFilter
                    key={filter.accessorKey}
                    type={filter.type}
                    onChangedFilter={handleChangedFilter}
                    column={table.getColumn(filter.accessorKey)}
                    title={filter.title}
                    options={filter.options}
                  />
                ))}
            </div>
            {bulkActions.length > 0 && (
              <DataTableBulkActions
                selectedRows={table
                  .getSelectedRowModel()
                  .rows.map((row) => row.original)}
                actions={bulkActions.map((action) => ({
                  render: (selectedRows: RowDataWithActions<TData>[]) =>
                    action.render(selectedRows, resetSelection),
                }))}
              />
            )}
          </div>
        </DataTableToolbar>
      )}

      <div className="rounded-md border mt-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="hover:bg-background">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <DataTableSkeleton />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className={cn('cursor-pointer', {
                    'hover:bg-background cursor-default': isNil(onRowClick),
                  })}
                  onClick={(e) => {
                    // Check if the clicked cell is not clickable
                    const clickedCellIndex = (e.target as HTMLElement).closest(
                      'td',
                    )?.cellIndex;
                    if (
                      clickedCellIndex !== undefined &&
                      columnsInitial[clickedCellIndex]?.notClickable
                    ) {
                      return; // Don't trigger onRowClick for not clickable columns
                    }
                    onRowClick?.(row.original, e.ctrlKey, e);
                  }}
                  onAuxClick={(e) => {
                    // Similar check for auxiliary click (e.g., middle mouse button)
                    const clickedCellIndex = (e.target as HTMLElement).closest(
                      'td',
                    )?.cellIndex;
                    if (
                      clickedCellIndex !== undefined &&
                      columnsInitial[clickedCellIndex]?.notClickable
                    ) {
                      return;
                    }
                    onRowClick?.(row.original, true, e);
                  }}
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <div className="flex items-center justify-start">
                        <div
                          onClick={(e) => {
                            if (cell.column.id === 'select') {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-background">
                <TableCell
                  colSpan={columns.length}
                  className="h-[350px] text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    {emptyStateIcon ? emptyStateIcon : <></>}
                    <p className="text-lg font-semibold">
                      {emptyStateTextTitle}
                    </p>
                    {emptyStateTextDescription && (
                      <p className="text-sm text-muted-foreground ">
                        {emptyStateTextDescription}
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!hidePagination && (
        <div className="flex flex-wrap items-center justify-center space-x-2 py-4 gap-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="w-[44px] h-[44px] rounded-lg"
              onClick={() => {
                const prevPageIndex = currentPage - 1;
                handleGoPage(prevPageIndex, currentLimit);
              }}
              disabled={currentPage === 0 || size(page?.data) === 0}
            >
              <IconArrowLeftBold />
            </Button>
            {(() => {
              const pageCount = table.getPageCount();
              const pages: (number | 'dots')[] = [];

              if (pageCount <= 5) {
                for (let i = 0; i < pageCount; i++) pages.push(i);
              } else {
                if (currentPage < 3) {
                  pages.push(0, 1, 2, 3, 'dots', pageCount - 1);
                } else if (currentPage > pageCount - 4) {
                  pages.push(
                    0,
                    'dots',
                    pageCount - 4,
                    pageCount - 3,
                    pageCount - 2,
                    pageCount - 1,
                  );
                } else {
                  pages.push(
                    0,
                    'dots',
                    currentPage - 1,
                    currentPage,
                    currentPage + 1,
                    'dots',
                    pageCount - 1,
                  );
                }
              }

              return pages.map((pageItem, index) =>
                pageItem === 'dots' ? (
                  <span
                    key={`dots-${index}`}
                    className="w-[44px] h-[44px] flex items-center justify-center"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageItem}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-[44px] h-[44px] rounded-lg font-bold text-md border-0 hover:!bg-transparent',
                      currentPage === pageItem
                        ? 'bg-accent-foreground text-accent hover:!bg-accent-foreground hover:!text-white'
                        : 'bg-transparent text-grayscale hover:!bg-transparent hover:!text-grayscale',
                    )}
                    onClick={() => {
                      handleGoPage(pageItem, currentLimit);
                    }}
                  >
                    {pageItem + 1}
                  </Button>
                ),
              );
            })()}
            <Button
              variant="outline"
              size="sm"
              className="w-[44px] h-[44px] rounded-lg"
              onClick={() => {
                const nextPageIndex = currentPage + 1;
                handleGoPage(nextPageIndex, currentLimit);
              }}
              disabled={
                currentPage === table.getPageCount() - 1 ||
                size(page?.data) === 0
              }
            >
              <IconArrowRightBold />
            </Button>
          </div>
          <div className="flex gap-3 items-center">
            <p className="text-black font-medium">Results per page:</p>
            <Select
              value={`${currentLimit}`}
              onValueChange={(value) => {
                setCurrentPage(0);
                const newLimit = Number(value);
                setCurrentLimit(newLimit);
                handleGoPage(0, newLimit);
              }}
            >
              <SelectTrigger className="!h-[38px] !w-[80px]">
                <SelectValue placeholder={currentLimit} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 30, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
