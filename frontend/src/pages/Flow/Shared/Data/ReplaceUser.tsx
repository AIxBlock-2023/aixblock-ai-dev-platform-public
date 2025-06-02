import React from "react";
import {useGetListMembers} from "@/hooks/settings/members/useGetListMembers";
import Select, {DataSelect, SelectOption} from "@/components/Select/Select";

export type TReplaceRoles = "annotator" | "qa" | "qc";

export type TProps = {
  organization: number,
  onChange: (role: TReplaceRoles, from: number, to: number) => void,
  registerProcessingSetter: (fn: null | ((state: boolean) => void)) => void,
}

export default function ReplaceUser({organization, onChange, registerProcessingSetter}: TProps) {
  const {dataMembers, loading} = useGetListMembers(organization, 1, -1);
  const [from, setFrom] = React.useState<number | null>(null);
  const [to, setTo] = React.useState<number | null>(null);
  const [role, setRole] = React.useState<TReplaceRoles>("annotator");
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);

  const userOptions: DataSelect[] = React.useMemo(() => {
    let options: SelectOption[] = [];

    if (dataMembers?.results) {
      dataMembers.results.forEach(m => {
        options.push({
          label: m.user.email,
          value: m.user.id.toString(),
        });
      });
    }

    return [{
      options,
    }];
  }, [dataMembers?.results]);

  React.useEffect(() => {
    if (!from || !to) {
      return;
    }

    onChange(role, from, to);
  }, [onChange, from, to, role]);

  React.useEffect(() => {
    registerProcessingSetter((state: boolean) => {
      setIsProcessing(state);
    });

    return () => {
      registerProcessingSetter(null);
    }
  }, [registerProcessingSetter, setIsProcessing]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <Select
        disabled={loading || isProcessing}
        label="Role"
        defaultValue={{label: "Annotator", value: "annotator"}}
        data={[{
          options: [
            {label: "Annotator", value: "annotator"},
            {label: "QA", value: "qa"},
            {label: "QC", value: "qc"},
          ],
        }]}
        onChange={o => setRole(o.value as TReplaceRoles)}
      />
      <Select
        disabled={loading || isProcessing}
        label="To be replaced"
        data={userOptions}
        onChange={e => setFrom(parseInt(e.value))}
        limitHeight={true}
      />
      <Select
        disabled={loading || isProcessing}
        label="Replaced by"
        data={userOptions}
        onChange={e => setTo(parseInt(e.value))}
        limitHeight={true}
      />
    </div>
  );
}
