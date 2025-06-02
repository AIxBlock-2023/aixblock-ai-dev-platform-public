import Select from "../Select/Select";
import React from "react";

export type TModelType = "training" | "inference";

export type TProps = {
  model_type: TModelType | undefined;
  onChange?: (model_type: TModelType) => void;
  label?: string;
  isProcessing?: boolean;
  isRequired?: boolean;
}

export default function ModelType({model_type, onChange, label, isProcessing, isRequired}: TProps) {
  const selectedOption = React.useMemo(() => {
    if (model_type === "training") {
      return {label: "Training", value: "training"};
    } else if (model_type === "inference") {
      return {label: "Inference", value: "inference"}
    }

    return undefined;
  }, [model_type]);

  return (
    <>
      <Select
        label={label ?? "Workflow"}
        placeholderText="Select workflow"
        disabled={isProcessing}
        isRequired={isRequired}
        data={[{
          options: [
            {label: "Training", value: "training"},
            {label: "Inference", value: "inference"},
          ],
        }]}
        defaultValue={selectedOption}
        onChange={o => {
          onChange?.(o.value as TModelType);
        }}
      />
    </>
  );
}
