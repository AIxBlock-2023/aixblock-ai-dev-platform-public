import { JSONSchemaType } from "ajv";
import createAjvValidator from "../utils/createAjvValidator";
import { marketplaceGpuModelSchema, TMarketplaceGpuModel } from "./marketplaceGpu";

export type TMarketplaceGpuListModel = {
  compute_id: number,
  compute_gpus: TMarketplaceGpuModel[],
  compute_name: string,
  rental_hours: number,
  compute_cpu: {
    name?: string,
    cpu?: string,
    ram?: string,
    storage?: string,
    diskType?: string,
    os?: string,
    serial_number?: string,
    ip?: string
  },
  is_scale: boolean,
  is_available?: boolean,
}[]

export const marketplaceGpuListModelSchema: JSONSchemaType<TMarketplaceGpuListModel> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      compute_id: { type: "number" },
      compute_name: { type: "string" },
      rental_hours: { type: "number" },
      compute_gpus: { type: "array", items: marketplaceGpuModelSchema },
      compute_cpu: {
        type: "object",
        properties: {
          name: { type: "string", nullable: true },
          cpu: { type: "string", nullable: true },
          ram: { type: "string", nullable: true },
          storage: { type: "string", nullable: true },
          diskType: { type: "string", nullable: true },
          os: { type: "string", nullable: true },
          serial_number: { type: "string", nullable: true },
          ip: { type: "string", nullable: true },
        },
      },
      is_scale: { type: "boolean" },
      is_available: { type: "boolean", nullable: true },
    },
    required: [
      "compute_id",
      "compute_name",
      "compute_gpus",
      "rental_hours",
      "compute_cpu",
      "is_scale",
    ],
    additionalProperties: true,
  }
}

export const validateMarketplaceGpuListModel = createAjvValidator<TMarketplaceGpuListModel>(marketplaceGpuListModelSchema);
