import { useNavigate, useParams } from "react-router-dom";
import Deposit from "@/pages/ComputesMarketplace/Deposit/Deposit";
import { useCallback, useMemo, useState } from "react";
import useWorkflowTemplateHook from "@/hooks/workflow/useWorkflowTemplateHook";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import { Converter } from "showdown";
import { useApi } from "@/providers/ApiProvider";
import { extractErrorMessage, extractErrorMessageFromResponse } from "@/utils/error";
import { toast } from "react-toastify";
import { infoDialog } from "@/components/Dialog";

const mdConverter = new Converter();

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {detail, loading, refresh} = useWorkflowTemplateHook(id ?? "000");
  const api = useApi();
  const [ isCreating, setIsCreating ] = useState(false);
  const [ refreshKey, setRefreshKey ] = useState(0);

  const handleRent = useCallback(() => {
    if (!id || !detail) {
      return;
    }

    const ar = api.call("createWorkflowTemplate", { params: { id } });
    setIsCreating(true);

    ar.promise
      .then(async r => {
        if (r.ok) {
          refresh();
          setRefreshKey(rk => rk + 1);
          navigate("/workflows/flows");

          infoDialog({
            title: "Workflow templates purchased",
            message: "You can use the new template by clicking on New flow > Use a template, then selecting the template you just purchased.",
          });

          return;
        }

        toast.error(await extractErrorMessageFromResponse(r));
      })
      .catch(e => {
        toast.error(extractErrorMessage(e));
      })
      .finally(() => {
        setIsCreating(false);
      });
  }, [ api, detail, id, refresh, navigate ]);

  const desc = useMemo(() => {
    if (!detail?.description) {
      return "";
    }

    return mdConverter.makeHtml(detail.description);
  }, [ detail?.description ]);

  if (loading) {
    return <EmptyContent message="Loading workflow template..." />;
  }

  if (!detail) {
    return <EmptyContent message="Workflow template not found" />;
  }

  if (isCreating) {
    return <EmptyContent message="Creating wrokflow template. Please wait a moment..." />;
  }

  return (
    <div>
      <Deposit
        key={"deposit-refresh-" + refreshKey}
        priceDetailGPU={detail.price}
        onHandleRent={handleRent}
        preview={detail.preview}
        customTitle={detail.name}
        customNote={(desc ?? "").trim().length > 0 ? <div dangerouslySetInnerHTML={{__html: desc}} /> : undefined}
      />
    </div>
  );
}
