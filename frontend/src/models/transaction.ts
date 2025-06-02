import {JSONSchemaType} from "ajv";
import createAjvValidator from "../utils/createAjvValidator";

export type TTransaction = {
  id: number;
  user_id: number;
  order_id?: number;
  amount?: number;
  description?: string;
  created_at: string;
  updated_at: string;
  wallet_address?: string;
  unit?: "usdc" | "usd" | "sol";
  network?: "fiat" | "paypal" | "stripe" | "solana";
  type?: "rent_compute" | "refund_compute" | "rent_model" | "refund_model" | "withdraw" | "topup" | "buy_workflow_template" | "sell_workflow_template";
}

const transactionSchema: JSONSchemaType<TTransaction> = {
  type: "object",
  properties: {
    id: {type: "integer"},
    user_id: {type: "integer"},
    order_id: {type: "integer", nullable: true},
    amount: {type: "number", nullable: true},
    description: {type: "string", nullable: true},
    created_at: {type: "string"},
    updated_at: {type: "string"},
    wallet_address: {type: "string", nullable: true},
    unit: {type: "string", enum: ["usdc", "usd", "sol"], nullable: true},
    network: {type: "string", enum: ["fiat", "paypal", "stripe", "solana"], nullable: true},
    type: {type: "string", enum: ["rent_compute", "refund_compute", "rent_model", "refund_model", "withdraw", "topup", "buy_workflow_template", "sell_workflow_template"], nullable: true},
  },
  required: ["id", "user_id", "created_at", "updated_at"],
  additionalProperties: true,
};

export type TTransactionsResponseDTO = {
  count: number;
  next?: string;
  previous?: string;
  results: TTransaction[];
};

const transactionsResponseSchema: JSONSchemaType<TTransactionsResponseDTO> = {
  type: "object",
  properties: {
    count: {type: "integer"},
    next: {type: "string", nullable: true},
    previous: {type: "string", nullable: true},
    results: {type: "array", items: transactionSchema},
  },
  required: ["count"],
  additionalProperties: true,
};

export const validateTransactionsResponse = createAjvValidator<TTransactionsResponseDTO>(transactionsResponseSchema);
