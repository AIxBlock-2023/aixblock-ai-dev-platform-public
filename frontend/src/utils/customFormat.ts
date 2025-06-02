export type TFLOP = {
  x: number | null,
  y: string | null;
}

export const formatBytes = (bytes: number, decimals?: number) => {
  if(!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(decimals ?? 2)} ${units[i]}`;
};

export const formatGpuMem = (bytes: number | undefined, decimals?: number): TFLOP => {
  if(!bytes || bytes === 0) return {
    x: null,
    y: "GB"
  };
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return {
    x: +bytes.toFixed(decimals ?? 2),
    y: units[i]
  };
};

export const formatCPU = (value: number | undefined, decimals: number = 2) => {
  if(!value) return "0 Hz";
  const units = ["Hz", "kHz", "MHz", "GHz"];
  let unitIndex = 0;
  
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return value.toFixed(decimals) + units[unitIndex];
};

export const convertFLOP = (value: number | undefined): TFLOP => {
  const units = ["FLOP", "KFLOP", "MFLOP", "GFLOP", "TFLOP", "PFLOP", "EFLOP", "ZFLOP", "YFLOP"];

  if (!value || value === 0) return {
    x: null,
    y: "TFLOP"
  };

  let unitIndex = 0;
  while (value && value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  return {
    x: +value?.toFixed(2),
    y: units[unitIndex]
  };
}

type TComputeCpu = {
  name?: string;
  cpu?: string;
  ram?: string;
  disk?: string;
  diskType?: string;
  os?: string;
  serial_number?: string;
  ip?: string;
};
export const formatCPULabel = (config: TComputeCpu) => {
  return `CPU ${config.cpu} - ${formatBytes(
    Number(config.ram) ?? 0
  )} RAM - ${formatBytes(Number(config.disk) ?? 0)} ${config.diskType} `;
};

export const formatFloat = (v: number, precision: number = 3) => {
  let power = Math.pow(10, precision || 0);
  return String(Math.ceil(v * power) / power);
}




/**
 * Converts bytes to gigabytes and formats the result to a specified number of decimal places.
 * 
 * @param bytes - The number of bytes to convert.
 * @param decimalPlaces - The number of decimal places to format the result to.
 * @returns The formatted gigabytes value.
 */
export const formatBytesToGB = (
  bytes: string | number | null | undefined,
  decimalPlaces: number = 2
): string | null => {
  if (bytes === null || bytes === undefined) {
    return null;
  }

  const bytesNumber = typeof bytes === "string" ? parseFloat(bytes) : bytes;

  if (isNaN(bytesNumber)) {
    return null;
  }

  const gb = bytesNumber / 1024 ** 3;
  return gb.toFixed(decimalPlaces);
};



/**
 * Converts the input value to gigabytes (GB) or retains it as GB based on its size.
 * 
 * @param input - The input value to convert, can be a number or string representing bytes or GB.
 * @param decimalPlaces - The number of decimal places to format the result to. Defaults to 2.
 * @returns The formatted value in GB, or null if the input is invalid.
 */
export const formatBytesOrGB = (
  input: string | number | null | undefined,
  decimalPlaces: number = 2
): string | null => {
  if (input === null || input === undefined) {
    return null;
  }

  const inputNumber = typeof input === "string" ? parseFloat(input) : input;

  if (isNaN(inputNumber) || inputNumber < 0) {
    return null;
  }

  // Assume that if the value is greater than or equal to 1 GB in bytes, the input is in bytes
  const isByte = inputNumber >= 1024 ** 3;

  if (isByte) {
    const gb = inputNumber / (1024 ** 3);
    return gb.toFixed(decimalPlaces);
  } else {
    return inputNumber.toFixed(decimalPlaces);
  }
};

export const formatWalletAddress = (address: string | null | undefined): string => {
  if (!address || !address.length) {
    return "Not connected";
  }
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
};


export const formatOnchainBalance = (
  balance: string | number,
  decimal: number = 9
): string => {
  const sol = Number(balance) / Math.pow(10, decimal);
  return sol.toFixed(4).toString();
};