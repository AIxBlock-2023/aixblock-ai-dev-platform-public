import React, {useCallback, useEffect, useMemo, useState} from "react";
import FlowLayout, {TProps as TFlowLayoutProps} from "../Shared/FlowLayout";
import {useLocation, useNavigate} from "react-router-dom";
import {useFlowProvider} from "../FlowProvider";
import {useUserLayout} from "@/layouts/UserLayout";
import { IconAddFolder, IconBoldGlobal, IconCloudLight, IconDocumentUpload, IconShare } from "@/assets/icons/Index";
import {useFlowDiagramUpdate} from "./hooks";
import {TNavbarBreadcrumb} from "@/components/Navbar/Navbar";
import DataPipelineDialog from "../Shared/DataPipeline/DataPipelineDialog";

export type TProps = React.PropsWithChildren<Pick<TFlowLayoutProps, "onBack" | "onSkip" | "onNext" | "bgColor">> & {
  withoutSteps?: boolean,
}

export default function LabelAndValidateDataLayout({children, onBack, onSkip, onNext, withoutSteps, bgColor}: TProps) {
  const navigate = useNavigate();
  const {pathname: url} = useLocation();
  const {project, flowStatus, isMeetRequirements, setMeetRequirements, initialized, patchProject, flowDiagram, permission, sharedNavbarActions} = useFlowProvider();
  const {setActions, clearActions, setCloseCallback, clearCloseCallback} = useUserLayout();
  const [showPipeline, setShowPipeline] = useState<boolean>(false);
  useFlowDiagramUpdate();

  const urlParts = useMemo(() => {
    return url.split("/");
  }, [url]);

  const secondarySteps = useMemo(() => {
    if (withoutSteps) {
      return;
    }

    if (urlParts[3] === "data-preparation") {
      return [
        {
          label: "Local Upload",
          activeChecker: () => urlParts[4] === "local-upload",
          icon: <IconDocumentUpload width={22} height={22} />,
          onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/data-preparation/local-upload") : undefined,
        },
        {
          label: "Cloud Storage Sync",
          activeChecker: () => urlParts[4] === "cloud-storage",
          icon: <IconCloudLight />,
          onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/data-preparation/cloud-storage") : undefined,
        },
        // {
        //   label: "Crawler",
        //   activeChecker: () => urlParts[4] === "crawler",
        //   icon: <IconBoldGlobal width={22} height={22} />,
        //   onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/data-preparation/crawler") : undefined,
        // },
        // {
        //   label: "Data Hubs",
        //   activeChecker: () => urlParts[4] === "data-hubs",
        //   icon: <IconShare />,
        //   onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/data-preparation/data-hubs") : undefined,
        // },
        // {
        //   label: "Crowdsource",
        //   activeChecker: () => urlParts[4] === "crowdsource",
        //   icon: <IconAddFolder />,
        //   onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/data-preparation/crowdsource") : undefined,
        // },
      ];
    }

    return null;
  }, [urlParts, withoutSteps, project, navigate]);

  const showDataPipeline = useMemo(() => {
    return urlParts.length > 4 && urlParts[3] === "data-preparation";
  }, [urlParts]);

  const onDataPipelineClick = useCallback(() => {
    setShowPipeline(true);
  }, []);

  const isShowWorkflow = useMemo(() => {
    if (urlParts.length > 4 && urlParts[4] === "marketplace") {
      return false;
    }

    return (urlParts.length >= 3 && urlParts[2] === "create")
      || (
        urlParts.length > 3
        && (["project", "setup-infrastructure", "data-preparation", "setup-compute", "setup-model", "settings"].includes(urlParts[3]))
      );
  }, [urlParts]);

  useEffect(() => {
    const isFlowStep = project?.id
      ? (urlParts.length <= 3 || urlParts[3].length === 0)
      : (urlParts.length <= 2 || urlParts[2].length === 0);
    const isDataPage = urlParts.length > 3 && urlParts[3] === "data";
    const isCreating = urlParts.length > 2 && urlParts[2] === "create";
    const isStepPages = urlParts.length > 3 && ["project", "setup-infrastructure", "data-preparation", "setup-compute", "setup-model"].includes(urlParts[3]);
    const isModelMarketplace = urlParts.length > 4 && urlParts[4] === "marketplace";

    // Model marketplace
    if (isModelMarketplace) {
      setActions([
          ...sharedNavbarActions,
        {label: "Back", actionType: "dark", onClick: () => navigate("/label-and-validate-data/" + project?.id + "/setup-model")},
      ]);
    }
    // Flow step: Cancel to dashboard
    else if (isFlowStep) {
      setActions([
        {label: "Cancel", actionType: "dark", onClick: () => navigate("/projects")},
      ]);
    }
    // While creating project or missing storage/compute/model: Cancel to dashboard
    // Existing project: Cancel to data
    else if (isCreating || (project && isStepPages)) {
      setActions([
        ...sharedNavbarActions,
        ...(
          isCreating || !isMeetRequirements
            ? [{label: "Cancel", actionType: "dark", onClick: () => navigate("/projects")}]
            : [
              {label: "Go to Data", actionType: "primary", onClick: () => navigate("/label-and-validate-data/" + project?.id + "/data")},
              {label: "Cancel", actionType: "dark", onClick: () => navigate("/projects")},
            ]
        ) as TNavbarBreadcrumb[],
      ]);
    }
    // Data page has its own actions and close callback
    else if (!isDataPage) {
      setCloseCallback("/label-and-validate-data/" + project?.id + "/data");

      if (permission.configure) {
        const isSettings = urlParts.length > 3 && urlParts[3] === "settings";

        setActions([
          ...sharedNavbarActions,
          {
            label: "Settings",
            actionType: isSettings ? "primary" : undefined,
            onClick: () => navigate("/label-and-validate-data/" + project?.id + "/settings")
          },
        ]);
      }
    }

    return () => {
      if (!isDataPage) {
        clearActions();
        clearCloseCallback();
      }
    };
  }, [clearActions, clearCloseCallback, isMeetRequirements, navigate, project, setActions, setCloseCallback, urlParts, permission, sharedNavbarActions]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    setMeetRequirements(flowStatus.hasStorage && (!flowStatus.hasMlAssisted || flowStatus.hasAddedModel || flowStatus.hasRentedModel));
  }, [flowStatus.hasStorage, flowStatus.hasAddedModel, flowStatus.hasRentedModel, initialized, setMeetRequirements, flowStatus.hasMlAssisted]);

  return (
    <FlowLayout
      primarySteps={isShowWorkflow || withoutSteps ? undefined : [
        {
          label: "Setup Project",
          activeChecker: () => url.startsWith("/label-and-validate-data/create") || urlParts[3] === "project",
          onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/project") : undefined,
        },
        {
          label: "Setup Infrastructure",
          activeChecker: () => urlParts[3] === "setup-infrastructure",
          onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/setup-infrastructure/storage") : undefined,
        },
        {
          label: "Data Preparation",
          activeChecker: () => urlParts[3] === "data-preparation",
          onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/data-preparation/local-upload") : undefined,
        },
        ...(flowStatus.hasMlAssisted ? [
          {
            label: "Setup Compute",
            activeChecker: () => urlParts[3] === "setup-compute",
            onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/setup-compute") : undefined,
          },
          {
            label: "Setup Model",
            activeChecker: () => urlParts[3] === "setup-model",
            onClick: () => project ? navigate("/label-and-validate-data/" + project?.id + "/setup-model") : undefined,
          },
        ] : []),
      ]}
      secondarySteps={withoutSteps ? undefined : secondarySteps}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
      bgColor={bgColor}
      onDataPipelineClick={showDataPipeline ? onDataPipelineClick : undefined}
      flowDiagram={isShowWorkflow ? flowDiagram : undefined}
    >
      {/*{isShowWorkflow ? (
        <div className={styles.workflowWrapper}>
          <Workflow flows={flowDiagram} />
          {children}
        </div>
      ) : children}*/}
      {children}
      {!!project && showDataPipeline && (
        <DataPipelineDialog
          show={showPipeline}
          project={project}
          patchProject={patchProject}
          onClose={() => setShowPipeline(false)}
          hasMLAssisted={flowStatus.hasMlAssisted}
        />
      )}
    </FlowLayout>
  )
}
