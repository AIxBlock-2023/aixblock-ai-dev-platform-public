import {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  MarkerType,
  Node,
  NodeTypes,
  OnConnect,
  OnSelectionChangeParams,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { forEach, size } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';

import { FlowGpu } from 'workflow-shared';
import GpuNode from './gpu-node';

// Node type definition for React Flow
const nodeTypes: NodeTypes = {
  gpuNode: GpuNode,
};

type GpuNodePropType = {
  datasource: FlowGpu[] | undefined;
};

const GpuDiagram: React.FC<GpuNodePropType> = ({
  datasource,
}: GpuNodePropType) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const selectedNodeRef = useRef<string | null>(null);

  // Handle node selection
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    if (params.nodes.length === 1) {
      selectedNodeRef.current = params.nodes[0].id;
    } else {
      selectedNodeRef.current = null;
    }
  }, []);

  // Toggle master status for a node
  const handleToggleMaster = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        // Find the current node being toggled
        const currentNode = nds.find((n) => n.id === nodeId);

        // If current node is not a master and is becoming master
        if (currentNode && !currentNode.data.isMaster) {
          // Find the current master node (if any)
          const currentMaster = nds.find((n) => n.data.isMaster);

          if (currentMaster) {
            // Remove old connections and add new ones
            setEdges((eds) => {
              // Find all connections from the current master
              const masterConnections = eds.filter(
                (edge: any) =>
                  edge.source === currentMaster.id && edge.target !== nodeId,
              );
              // Create new connections from the new master to same targets
              const newEdges = masterConnections.map((edge: any) => ({
                id: `${nodeId}-${edge.target}`,
                source: nodeId,
                target: edge.target,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#555',
                },
              }));
              const filteredEdges = eds.filter(
                (edge) => edge.source !== currentMaster.id,
              );
              return [...filteredEdges, ...newEdges];
            });
          }
        }
        return nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                isMaster: !node.data.isMaster,
              },
            };
          } else {
            return {
              ...node,
              data: {
                ...node.data,
                isMaster: false,
              },
            };
          }
        });
      });
    },
    [setEdges, setNodes],
  );

  // Handle connection between nodes (only from master to non-master)
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // Find source and target nodes
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      // Only allow connections from master to non-master nodes
      if (
        sourceNode &&
        targetNode &&
        sourceNode.data.isMaster &&
        !targetNode.data.isMaster
      ) {
        setEdges((eds) =>
          addEdge(
            {
              ...connection,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#555', // màu của mũi tên
              },
            },
            eds,
          ),
        );
      }
    },
    [nodes, setEdges],
  );

  useEffect(() => {
    const nodes: Node[] = [];
    forEach(datasource || [], (compute, index) => {
      if (size(compute.compute_gpus) > 0) {
        forEach(compute.compute_gpus, (gpu) => {
          nodes.push({
            id: gpu.id,
            type: 'gpuNode',
            position: { x: 250 * index, y: 100 + (index % 2) * 150 },
            data: {
              ...gpu,
              compute_name: compute.compute_name,
              type: compute.type,
              onToggleMaster: handleToggleMaster,
            },
            selected: false,
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          });
        });
      }
    });
    setNodes(nodes);
  }, [datasource, handleToggleMaster, setNodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onSelectionChange={onSelectionChange}
      nodeTypes={nodeTypes}
      fitView
    >
      <Controls />
      <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
    </ReactFlow>
  );
};
export default GpuDiagram;
