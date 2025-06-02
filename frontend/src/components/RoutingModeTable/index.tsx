import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import styles from './RoutingModeTable.module.scss'
import Checkbox from "../Checkbox/Checkbox";
import Select, { SelectOption } from "../Select/Select";
import { useApi } from "@/providers/ApiProvider";
import Switch from "../Switch/Switch";


const RoutingModeOptions = [
  {label: 'Load balance', value: 'load_balance'},
  {label: 'Random', value: 'random' },
  { label: 'Sequentially', value: 'sequentially' }
]

const WorkFlowOptions = [
  {label: "All", value: "all"},
  {label: "Training", value: "training"},
  {label: "Inference", value: "inference"},
]

const RoutingModeRow = ({ item, index, handleCheckboxChange, handleChangeStatus, handleChangeRoutingMode }: { 
  item: any;
  index: number;
  handleCheckboxChange: (id: number) => void;
  handleChangeStatus: (id: number, status: boolean) => void;
  handleChangeRoutingMode: (id: number, value: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={styles.RoutingNodeTableBodyRow}
    >
      <td className={styles.RoutingNodeTableBodyRowCheckBox}>
        <Checkbox label="" checked={item.checked} onChange={() => handleCheckboxChange(item.id)} />
      </td>
      <td className={styles.RoutingNodeTableBodyRowTd}>
        <span
          {...listeners}
          {...attributes}
          className={styles.RoutingNodeTableBodyDragIcon}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="lucide lucide-menu"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </span>
      </td>
      <td>{item.label}</td>
      <td>
        <Switch checked={item.status} onChange={(checked) => handleChangeStatus(item.id, checked)} />
      </td>
      <td>
        <Select
          data={[
            {
              label: "",
              options: RoutingModeOptions,
            },
          ]}
          onChange={(e) => handleChangeRoutingMode(item.id, e.value)}
          defaultValue={RoutingModeOptions.find((routing) => routing.value === item.routingMode)}
        />
      </td>
    </tr>
  );
};

interface IRoutingMode {
  id: number;
  status: boolean;
  label: string;
  checked: boolean;
  type: string;
  clusterMode: string;
  routingMode: string;
  order: number;
}

const RoutingModeTable = ({ projectId }: {projectId?: number}) => {
  const [items, setItems] = useState<IRoutingMode[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));
  const api = useApi();
  const [selectAll, setSelectAll] = useState(false);
  const [filter, setFilter] = useState<SelectOption>();
  const [changed, setChanged] = useState(false);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      setChanged(true);
      setItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  useEffect(() => {
    const getMlNetwork = async () => {
      if (!projectId) {
        setItems([]);
        return;
      };
      try {
        const ar = api.call("mlNetWork", {
          query: new URLSearchParams({
            project_id: projectId?.toString(),
          })
        });
        const response = await ar.promise;
        const data: any = await response.json()
        const ml_network: any = data.ml_network.map((network: any) => {
          return { 
            id: network.id,
            status: network.routing_mode_status, 
            label: network.name,
            routingMode: network.routing_mode,
            order: network.routing_order,
            clusterMode: network.cluster_mode,
            type: network.type,
          }
        });
        ml_network.sort((a: any, b: any) => a.order - b.order);
        setItems(ml_network)
      } catch (e) {
        setItems([]);
      }
    }
    getMlNetwork()
  }, [api, projectId]);

  useEffect(() => {
    if (!changed) return;
    const updateRoutingMode = async () => {
      if (!projectId) {
        setItems([]);
        return;
      };
      try {
        const ar = api.call("updateRoutingMode", {
          query: new URLSearchParams({
            project_id: projectId?.toString(),
          }),
          body: {
            ml_networks: items.map((ml_network: IRoutingMode, index: number) => ({
              routing_mode: ml_network.routingMode,
              order: index,
              id: ml_network.id,
              routing_mode_status: ml_network.status,
              cluster_mode: ml_network.clusterMode,
            }))
          },
        });
        await ar.promise;
      } catch (e) {
      }
    }
    updateRoutingMode();
  }, [items, api, projectId, changed]);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setItems(items.map((item) => ({ ...item, checked: newSelectAll })));
  };

  const handleCheckboxChange = (id: number) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      setSelectAll(updatedItems.every((item) => item.checked));
      return updatedItems;
    });
  };

  const handleChangeStatus = (id: number, status: boolean) => {
    setChanged(true);
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, status: status } : item
      );
      return updatedItems;
    });
  }

  const handleChangeRoutingMode = (id: number, value: string) => {
    setChanged(true);
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, routingMode: value } : item
      );
      return updatedItems;
    });
  }

  const listNodes = useMemo(() => {
    let data = items;
    if (filter && filter.value !== 'all') {
      data = items.filter((item) => item.type === filter.value)
    }
    return data
  }, [items, filter])

  return (
    <>
      <div className={styles.RoutingNodeTableFilter}>
        <Select
          label={"Filter"}
          placeholderText="Select filter"
          data={[{
            options: WorkFlowOptions,
          }]}
          onChange={(e) => {
            setItems(items.map((item) => ({
              ...item,
              checked: false
            })));
            setSelectAll(false);
            setFilter(e);
          }}
        />
        <Select
          label={"Cluster"}
          placeholderText="Select Cluster"
          data={[
            {
              options: RoutingModeOptions,
            },
          ]}
          onChange={(e) => {
            setChanged(true);
            setItems(items.map((item: IRoutingMode) => {
              if (item.checked) {
                item.clusterMode = e.value;
              }
              return item;
            }))
          }}
          disabled={!listNodes.some((item) => item.checked)}
        />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className={styles.RoutingNodeTable}>
          <thead>
            <tr>
              <th className={`${styles.RoutingNodeTableHeader} ${styles.RoutingNodeTableHeaderSelectIcon}`}>
                <Checkbox label="" checked={selectAll} onChange={handleSelectAll} />
              </th>
              <th className={`${styles.RoutingNodeTableHeader} ${styles.RoutingNodeTableHeaderDragIcon}`}></th>
              <th className={styles.RoutingNodeTableHeader}>Name</th>
              <th className={styles.RoutingNodeTableHeader}>Status</th>
              <th className={styles.RoutingNodeTableHeader}>Routing mode</th>
            </tr>
          </thead>
          <SortableContext items={listNodes} strategy={verticalListSortingStrategy}>
            <tbody>
              {listNodes.map((item, index) => (
                <RoutingModeRow
                  key={item.id}
                  item={item}
                  index={index}
                  handleCheckboxChange={handleCheckboxChange}
                  handleChangeStatus={handleChangeStatus}
                  handleChangeRoutingMode={handleChangeRoutingMode}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </>
  );
};

export default RoutingModeTable;