import { Handle, NodeProps, Position } from '@xyflow/react';
import { toString } from 'lodash';
import { NetworkIcon } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export type GpuNodeDataType = GpuData & {
  onToggleMaster: (id: string) => void;
  [key: string]: unknown;
};

// Props for the GPU node component
export interface GpuNodeProps extends NodeProps {
  data: GpuNodeDataType;
}
// Define the GPU node data structure
export interface GpuData {
  id: string;
  name: string;
  model: string;
  memory: string;
  isMaster: boolean;
}

const GpuNode: React.FC<GpuNodeProps> = ({ data, selected }: GpuNodeProps) => {
  const handleToggle = () => {
    data.onToggleMaster(data.id);
  };

  const gpuName = `${toString(data['gpu_name'])}`;

  return (
    <div
      className={cn(
        'transition-all rounded-sm border border-solid border-border relative hover:border-primary group shadow-step-container bg-background p-3 min-w-[260px] w-[260px] group text-sm',
        {
          'border-primary': selected,
          selected: selected,
          master: data.isMaster,
        },
      )}
    >
      <div
        className={cn(
          'absolute left-0 top-0 pointer-events-none  rounded-sm w-full h-full',
          {
            'border-t-[3px] border-primary border-solid': selected,
          },
        )}
      />
      <Handle
        className={cn({ 'invisible ': data.isMaster })}
        type="target"
        isConnectableStart={false}
        isConnectableEnd={true}
        position={Position.Top}
      />
      <Handle
        className={cn('hover:bg-primary', { 'invisible ': !data.isMaster })}
        isConnectableStart={data.isMaster}
        isConnectableEnd={!data.isMaster}
        id="master"
        type="source"
        position={Position.Bottom}
      />

      <div className="gpu__content">
        <div className="flex items-center">
          <h3 className={cn('mb-0')}>{data.name}</h3>
        </div>

        <div className="text-xs font-semibold">{gpuName}</div>
        <div className="text-xs">{toString(data['compute_name'])}:1234</div>
      </div>

      {/* Output handle for master nodes only */}

      {data.isMaster && (
        <div className="absolute top-3 right-3 text-primary">
          <NetworkIcon height="1rem" width="1rem" />
        </div>
      )}
      {!data.isMaster && (
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out items-center absolute top-2 right-2 text-xss flex">
          <Checkbox
            className="w-3 h-3"
            id={`master-${data.id}`}
            checked={data.isMaster}
            onCheckedChange={handleToggle}
          />
          <label className="ml-1" htmlFor={`master-${data.id}`}>
            Master
          </label>
        </div>
      )}
    </div>
  );
};

export default GpuNode;
