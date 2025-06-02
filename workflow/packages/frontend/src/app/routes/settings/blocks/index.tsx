import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Package, Trash } from 'lucide-react';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { RequestTrial } from '@/app/components/request-trial';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LockedAlert } from '@/components/ui/locked-alert';
import { PieceIcon } from '@/features/pieces/components/block-icon';
import { piecesApi } from '@/features/pieces/lib/blocks-api';
import { piecesHooks } from '@/features/pieces/lib/blocks-hook';
import { platformHooks } from '@/hooks/platform-hooks';
import { BlockScope, BlockType, isNil } from 'workflow-shared';

import { TableTitle } from '../../../../components/ui/table-title';

import { InstallPieceDialog } from '@/features/pieces/components/install-block-dialog';
import { BlockMetadataModelSummary } from 'workflow-blocks-framework';
import { ManagePiecesDialog } from './manage-blocks-dialog';

const columns: ColumnDef<RowDataWithActions<BlockMetadataModelSummary>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('App')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          <PieceIcon
            circle={true}
            size={'md'}
            border={true}
            displayName={row.original.displayName}
            logoUrl={row.original.logoUrl}
            showTooltip={false}
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'displayName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Display Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'packageName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Package Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">
        {
          row.original.name
            .replace("@activepieces/piece-", "@aixblock/block-")
            .replace("@activepieces/", "@aixblock/")
        }
      </div>;
    },
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Version')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.version}</div>;
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      if (
        row.original.blockType === BlockType.CUSTOM &&
        !isNil(row.original.projectId)
      ) {
        return (
          <ConfirmationDeleteDialog
            title={t('Delete {name}', { name: row.original.name })}
            entityName={t('Block')}
            message={t(
              'This will permanently delete this block, all steps using it will fail.',
            )}
            mutationFn={async () => {
              row.original.delete();
              await piecesApi.delete(row.original.id!);
            }}
          >
            <div className="flex items-end justify-end">
              <Button variant="ghost" className="size-8 p-0">
                <Trash className="size-4 text-destructive" />
              </Button>
            </div>
          </ConfirmationDeleteDialog>
        );
      }
      return null;
    },
  },
];

const ProjectPiecesPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('name') ?? '';
  const { pieces, isLoading, refetch } = piecesHooks.usePieces({
    searchQuery,
  });

  const bulkActions: BulkAction<BlockMetadataModelSummary>[] = useMemo(
    () => [
      {
        render: () => {
          return (
            <InstallPieceDialog
              onInstallPiece={() => refetch()}
              scope={BlockScope.PLATFORM}
              triggerSize="default"
            />
          );
        },
      },
      {
        render: () => {
          return <ManagePiecesDialog onSuccess={() => refetch()} />;
        },
      },
    ],
    [refetch],
  );

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4">
      <div className="mx-auto w-full flex-col">
        {!platform.managePiecesEnabled && (
          <LockedAlert
            title={t('Control Blocks')}
            description={t(
              "Show the blocks that matter most to your users and hide the ones you don't like.",
            )}
            button={
              <RequestTrial
                featureKey="ENTERPRISE_PIECES"
                buttonVariant="outline-primary"
              />
            }
          />
        )}
        <TableTitle>{t('Blocks')}</TableTitle>
        <DataTable
          emptyStateTextTitle={t('No blocks found')}
          emptyStateTextDescription={t(
            'Add a block to your project that you want to use in your automations',
          )}
          emptyStateIcon={<Package className="size-14" />}
          columns={columns}
          filters={[
            {
              type: 'input',
              title: t('Block Name'),
              accessorKey: 'name',
              options: [],
              icon: CheckIcon,
            } as const,
          ]}
          page={{
            data: pieces ?? [],
            next: null,
            previous: null,
          }}
          isLoading={isLoading}
          hidePagination={true}
          bulkActions={platform.managePiecesEnabled ? bulkActions : []}
        />
      </div>
    </div>
  );
};

ProjectPiecesPage.displayName = 'ProjectPiecesPage';
export { ProjectPiecesPage };
