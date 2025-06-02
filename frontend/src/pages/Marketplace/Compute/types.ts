export const PROVIDERS_LIST = {
  "nvidia": "NVIDIA",
  "amd": "AMD",
  "intel": "Intel",
  "mbs": "MBS",
}

export const SERVICES_LIST = {
  // "full": "All",
  "model-training": "Model training",
  // "platform": "Platform hosting",
  // "notebook": "Notebook",
  "storage": "Storage",
  "label-tool": "Labeling tool",
};

export const GPUS_LIST = {
  "any": "Any",
  "1x": "1x",
  "2x": "2x",
  "4x": "4x",
  "8x": "8x",
}

export const DISK_TYPES_LIST = {
  "ssd": "SSD",
  "nvme": "NVME",
}

export const MACHINE_TYPES_LIST = {
  "secure-cloud": "Secure Cloud (Only Trusted Datacenters)",
  "virtual-machines": "Virtual Machines",
  "physical-machines": "Physical Machines",
}

export type TTComputeMarketplaceV2FilterRange = {
  from: string,
  to: string,
}

export type TCountry = {
  id: string,
  alpha2: string,
  alpha3: string,
  name: string,
}

export type TComputeMarketplaceV2Filter = {
  search: string,
  provider: keyof typeof PROVIDERS_LIST | null,
  location: TCountry | null,
  service_type: keyof typeof SERVICES_LIST,
  gpus_machine: keyof typeof GPUS_LIST,
  vcpu_model_training: string,
  disk_type: "" | keyof typeof DISK_TYPES_LIST,
  free_time: TTComputeMarketplaceV2FilterRange,
  reliability: "" | TTComputeMarketplaceV2FilterRange,
  machine_options: Array<keyof typeof MACHINE_TYPES_LIST>,
  cuda_version: string,
  driver_version: string,
  ubuntu_version: string,
  price: "" | TTComputeMarketplaceV2FilterRange,
  gpu_count: "" | TTComputeMarketplaceV2FilterRange,
  tflops: "" | TTComputeMarketplaceV2FilterRange,
  per_gpu_ram: "" | TTComputeMarketplaceV2FilterRange,
  gpu_total_ram: "" | TTComputeMarketplaceV2FilterRange,
  gpu_ram_bandwidth: "" | TTComputeMarketplaceV2FilterRange,
  pcie_bandwidth: "" | TTComputeMarketplaceV2FilterRange,
  nvlink_bandwidth: "" | TTComputeMarketplaceV2FilterRange,
  cpu_cores: "" | TTComputeMarketplaceV2FilterRange,
  cpu_ram: "" | TTComputeMarketplaceV2FilterRange,
  cpu_ghz: "" | TTComputeMarketplaceV2FilterRange,
  disk_bandwidth: "" | TTComputeMarketplaceV2FilterRange,
  inet_up: "" | TTComputeMarketplaceV2FilterRange,
  inet_down: "" | TTComputeMarketplaceV2FilterRange,
  open_port: "" | TTComputeMarketplaceV2FilterRange,
  page: number,
  page_size: number,
  disk_size: "" | string,
  dlp_score: "" | TTComputeMarketplaceV2FilterRange,
}

export const DEFAULT_FILTER: TComputeMarketplaceV2Filter = {
  search: "",
  provider: "nvidia",
  location: {
    id: "",
    alpha2: "",
    alpha3: "",
    name: "",
  },
  service_type: "model-training",
  gpus_machine: "any",
  vcpu_model_training: "",
  disk_type: "",
  free_time: {from: "", to: ""},
  reliability: "", // {from: "50", to: "100"},
  machine_options: [],
  cuda_version: "",
  driver_version: "",
  ubuntu_version: "",
  price: "", // {from: "0", to: "20"},
  gpu_count: "", // {from: "0", to: "8"},
  tflops: "", // {from: "0", to: "500"},
  per_gpu_ram: "", // {from: "1", to: "4000"},
  gpu_total_ram: "", // {from: "1", to: "8000"},
  gpu_ram_bandwidth: "", // {from: "10", to: "8000"},
  pcie_bandwidth: "", // {from: "1", to: "512000"},
  nvlink_bandwidth: "", // {from: "1", to: "2000000"},
  cpu_cores: "", // {from: "1", to: "512"},
  cpu_ram: "", // {from: "1", to: "10000"},
  cpu_ghz: "", // {from: "128", to: "8000"},
  disk_bandwidth: "", // {from: "1", to: "128000"},
  inet_up: "", // {from: "1", to: "8000"},
  inet_down: "", // {from: "1", to: "8000"},
  open_port: "", // {from: "0", to: "65536"},
  page: 1,
  page_size: 20,
  disk_size: "40",
  dlp_score: "",
}

export type TComputeMarketplaceV2Status =
  "created"
  | "in_marketplace"
  | "rented_bought"
  | "completed"
  | "pending"
  | "suspend"
  | "expired"
  | "failed";

export type TComputeMarketplaceV2Type = "MODEL-SYSTEM" | "MODEL-CUSTOMER" | "MODEL-PROVIDER-VAST";
export type TComputeMarketplaceV2ComputeType = "full" | "model-training" | "ml";
export type TComputeMarketplaceV2TimeWorkingStatus = "created" | "completed" | "pending" | "suspend";

export type TComputeMarketplaceV2GPU = {
  [k: string]: Array<{
    id: number,
    vast_contract_id: number,
    provider_name: string,
    num_gpus?: number | null,
    compute_marketplace: {
      id: number,
      name: string,
      deleted_at: string | null,
      infrastructure_id: string,
      owner_id: number,
      arthor_id: number,
      catalog_id: number,
      ip_address: string,
      port: string,
      config?: string | object | null,
      is_using_cpu?: boolean | null,
      compute_type?: TComputeMarketplaceV2ComputeType | null,
      status: TComputeMarketplaceV2Status,
      type: TComputeMarketplaceV2Type,
      file?: string | null,
      cpu_price?: number | null,
      compute_time_working: {
        id: number,
        day_range: Array<{
          start_day: string, // 2024-05-10T17:00:00.000Z
          end_day: string, // 2026-05-30T17:00:00.000Z
        }>,
        status: TComputeMarketplaceV2TimeWorkingStatus,
        time_start: string, // 00:00:00
        time_end: string, // 23:59:59
      },
    },
    prices: Array<{
      id: number,
      token_symbol: string,
      price: number,
      unit: string,
      type: string,
      compute_gpu_id: number,
      compute_marketplace_id: number,
      model_marketplace_id?: number | null,
    }>,
    gpu_name?: string | null,
    power_consumption?: string | null,
    memory_usage?: string | null,
    power_usage?: string | null,
    gpu_index: number,
    gpu_memory?: string | null,
    gpu_tflops?: string | null,
    branch_name?: string | null,
    batch_size?: number | null,
    gpu_id?: string | null,
    serialno?: string | null,
    machine_options?: keyof typeof MACHINE_TYPES_LIST | null,
    created_at?: string | null,
    updated_at?: string | null,
    deleted_at?: string | null,
    quantity_used?: number | null,
    user_rented?: number | null,
    max_user_rental?: number | null,
    status: TComputeMarketplaceV2Status,
    owner_id?: number | null,
    infrastructure_id?: string | null,
    provider_id: number,
    per_gpu_ram?: string | null,
    max_cuda_version?: number | null,
    per_gpu_memory_bandwidth?: number | null,
    motherboard?: string | null,
    internet_up_speed?: number | null,
    internet_down_speed?: number | null,
    number_of_pcie_per_gpu?: string | null,
    per_gpu_pcie_bandwidth?: string | null,
    eff_out_of_total_nu_of_cpu_virtual_cores?: string | null,
    eff_out_of_total_system_ram?: string | null,
    max_duration?: number | null,
    reliability?: number | null,
    dl_performance_score?: number | null,
    dlp_score?: number | null,
    location_id?: number | null,
    location_alpha2?: string | null,
    location_name?: string | null,
    datacenter?: string | null,
  }>,
}

export type TComputeMarketplaceV2CPU = {
  id: number,
  name: string,
  deleted_at?: string | null,
  infrastructure_id: string,
  owner_id: number,
  author_id: number,
  catalog_id: number,
  ip_address: string,
  port: string,
  config: string,
  is_using_cpu: boolean,
  compute_type?: TComputeMarketplaceV2ComputeType | null,
  status: TComputeMarketplaceV2Status,
  type: TComputeMarketplaceV2Type,
  file?: string | null,
  cpu_price: {
    id: number,
    token_symbol: string,
    price: number,
    unit: string,
    type: string,
    compute_marketplace_id: number,
  },
  compute_time_working: {
    id: number,
    day_range: Array<{
      start_day: string, // 2024-05-10T17:00:00.000Z
      end_day: string, // 2026-05-30T17:00:00.000Z
    }>,
    status: TComputeMarketplaceV2TimeWorkingStatus,
    time_start: string, // 00:00:00
    time_end: string, // 23:59:59
  },
  provider_id: number,
  per_gpu_ram?: string | null,
  max_cuda_version?: number | null,
  per_gpu_memory_bandwidth?: number | null,
  motherboard?: string | null,
  internet_up_speed?: number | null,
  internet_down_speed?: number | null,
  number_of_pcie_per_gpu?: string | null,
  per_gpu_pcie_bandwidth?: string | null,
  eff_out_of_total_nu_of_cpu_virtual_cores?: string | null,
  eff_out_of_total_system_ram?: string | null,
  max_duration?: number | null,
  reliability?: number | null,
  dl_performance_score?: number | null,
  dlp_score?: number | null,
  location_id?: number | null,
  location_alpha2?: string | null,
  location_name?: string | null,
  datacenter?: string | null,
}

export type TComputeMarketplaceV2ResultsGPU = {
  compute: TComputeMarketplaceV2GPU[];
}

export type TComputeMarketplaceV2ResultsCPU = {
  compute_cpu: TComputeMarketplaceV2CPU[]
}

export type TComputeMarketplaceV2Results = Array<
  TComputeMarketplaceV2ResultsGPU | TComputeMarketplaceV2ResultsCPU
>

export interface TComputeMarketplaceV2SelectedOption {
  tokenSymbol: string;
  label: string;
  services: string;
  specs: {
    os?: string | null,
    ram?: number | null,
    diskSize?: string | null,
    diskType?: string | null,
    cpu?: string | null,
  };
  id: string;
  gpu_name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  ids: string[];
  vast_contract_id?: number;
  provider_name?: string;
  is_cpu?: boolean;
  hours: number,
  canInstallAllService?: boolean,
}
