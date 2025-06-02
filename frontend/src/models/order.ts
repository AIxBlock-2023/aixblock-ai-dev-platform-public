import {JSONSchemaType} from "ajv";
import createAjvValidator from "../utils/createAjvValidator";
import { TComputeInstallStatus } from "@/hooks/computes/useRentedGpu";

export type ComputeGpu = {
  id: number;
  compute_marketplace: {
    id: number
    ip_address?: string | null;
    port?: string | null;
  },
  history_order: {
    id: number;
    time_start: string;
    rental_hours: number;
    time_end: string;
    order_id: number;
    date: string;
    mail_end_send: boolean
    status: string;
    type: string;
    compute_install: TComputeInstallStatus;
    service_type: string;
    install_logs?: string | null;
    created_at: string;
    updated_at?: string | null;
    deleted_at?: string | null;
    quantity_used: number;
    ip_address?: string | null;
    port?: string | null;
    container_network?: string | null;
    deleted_by: string;
    account: number;
    compute_marketplace: number;
    compute_gpu: number;
  };
  datacenter: string;
  gpu_name: string;
  eff_out_of_total_nu_of_cpu_virtual_cores?: string | null;
  eff_out_of_total_system_ram?: string | null;
  gpu_tflops?: string | null;
  internet_down_speed?: string | null;
  internet_up_speed?: string | null;
  location_name?: string | null;
  max_cuda_version?: string | null;
  number_of_pcie_per_gpu?: string | null;
  motherboard?: string | null;
  gpu_memory_bandwidth?: string | null;
  gpu_memory?: string | null;
  machine_options?: string | null;
  provider_id?: number | null;
}

export type TOrder = {
  id: number;
  total_amount: number;
  price: string;
  status: string;
  unit: string;
  payment_method: string;
  payment_code?: string | null;
  service_fee?: string | null;
  reward_points_used?: number | null;
  created_at: string;
  updated_at: string;
  payer_email: string;
  payer_full_name: string;
  user: number;
  model_marketplace?: number | null;
  compute_gpus: ComputeGpu[];
}

const orderSchema: JSONSchemaType<TOrder> = {
  type: "object",
  properties: {
    id: {type: "integer"},
    total_amount: {type: "number"},
    price: {type: "string"},
    status: {type: "string"},
    unit: {type: "string"},
    payment_method: {type: "string"},
    payment_code: {type: "string", nullable: true},
    service_fee: {type: "string", nullable: true},
    reward_points_used: {type: "number", nullable: true},
    created_at: {type: "string"},
    updated_at: {type: "string"},
    payer_email: {type: "string"},
    payer_full_name: {type: "string"},
    user: {type: "integer"},
    model_marketplace: {type: "integer", nullable: true},
    compute_gpus: {type: "array", items: {type: "object", additionalProperties: true, required: []}},
  },
  required: [
    "id",
    "total_amount",
    "price",
    "status",
    "unit",
    "payment_method",
    "created_at",
    "updated_at",
    "payer_email",
    "payer_full_name",
    "user",
    "compute_gpus",
  ],
  additionalProperties: true,
};

export type TOrdersResponseDTO = {
  count: number;
  next?: string;
  previous?: string;
  results: TOrder[];
};

const ordersResponseSchema: JSONSchemaType<TOrdersResponseDTO> = {
  type: "object",
  properties: {
    count: {type: "integer"},
    next: {type: "string", nullable: true},
    previous: {type: "string", nullable: true},
    results: {type: "array", items: orderSchema},
  },
  required: ["count"],
  additionalProperties: true,
};

export const validateOrdersResponse = createAjvValidator<TOrdersResponseDTO>(ordersResponseSchema);
