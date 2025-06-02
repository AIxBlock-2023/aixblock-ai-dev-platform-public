import { Static, Type } from '@sinclair/typebox'
import { BaseModelSchema, Nullable } from '../common/base-model'



// GPU Info schema
export const GpuInfo = Type.Object({
    id: Type.String(),
    gpu_name: Type.String(),
    power_consumption: Type.Number(),
    memory_usage: Type.Number(),
    gpu_index: Type.Number(),
    gpu_id: Type.String(),
    branch_name: Type.String(),
})

// CPU Info schema
export const CpuInfo = Type.Object({
    cores: Type.Optional(Nullable(Type.Number())),
    threads: Type.Optional(Nullable(Type.Number())),
    model: Type.Optional(Nullable(Type.String())),
})

// ComputeResource schema
export const FlowGpu = Type.Object({
    compute_gpus: Type.Array(GpuInfo),
    compute_cpu: CpuInfo,
    is_using_cpu: Type.Boolean(),
    compute_name: Type.String(),
    compute_id: Type.Number(), // Nếu là UUID string thì đổi thành Type.String()
    type: Type.String(),
    is_scale: Type.Boolean(),
})

export type FlowGpu = Static<typeof FlowGpu>
export const FlowGpuMetadata = Type.Object({
    ...BaseModelSchema,
    name: Type.String(),
    displayName: Nullable(Type.String()),
    description: Nullable(Type.String()),
})

export type FlowGpuMetadata = Static<typeof FlowGpuMetadata>