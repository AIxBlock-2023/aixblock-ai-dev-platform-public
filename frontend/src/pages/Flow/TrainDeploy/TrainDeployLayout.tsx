import React, {useEffect, useMemo} from "react";
import FlowLayout, {TProps as TFlowLayoutProps} from "../Shared/FlowLayout";
import {useLocation, useNavigate} from "react-router-dom";
import {useFlowProvider} from "../FlowProvider";
import {useUserLayout} from "@/layouts/UserLayout";
import { IconAddFolder, IconBoldGlobal, IconCloudLight, IconData, IconDocumentUpload, IconShare } from "@/assets/icons/Index";
import IconCpu from "@/assets/icons/IconCpu";
import {useFlowDiagramUpdate} from "./hooks";
import {TNavbarBreadcrumb} from "@/components/Navbar/Navbar";
// import {confirmDialog} from "@/components/Dialog";

export type TProps = React.PropsWithChildren<Pick<TFlowLayoutProps, "onBack" | "onSkip" | "onNext" | "bgColor">> & {
  withoutSteps?: boolean,
}

export default function TrainDeployLayout({children, onBack, onSkip, onNext, withoutSteps, bgColor}: TProps) {
  const navigate = useNavigate();
  const {pathname: url} = useLocation();
  const {project, flowStatus, isMeetRequirements, setMeetRequirements, initialized, flowDiagram, setShowPipeline, permission, sharedNavbarActions} = useFlowProvider();
  const {setActions, clearActions, setCloseCallback, clearCloseCallback} = useUserLayout();
  useFlowDiagramUpdate();

  const urlParts = useMemo(() => {
    return url.split("/");
  }, [url]);

  const secondarySteps = useMemo(() => {
    if (withoutSteps) {
      return;
    }

    if (urlParts[3] === "setup-infrastructure") {
      return [
        {
          label: "Storage",
          activeChecker: () => urlParts[4] === "storage",
          icon: <IconData />,
          onClick: project ? () => navigate("/train-and-deploy/" + project?.id + "/setup-infrastructure/storage") : undefined,
        },
        {
          label: "GPU for training and deploying",
          activeChecker: () => urlParts[4] === "gpu",
          icon: <IconCpu />,
          onClick: project ? () => navigate("/train-and-deploy/" + project?.id + "/setup-infrastructure/gpu") : undefined,
        },
      ];
    }

    if (urlParts[3] === "data-preparation") {
      return [
        {
          label: "Local Upload",
          activeChecker: () => urlParts[4] === "local-upload",
          icon: <IconDocumentUpload width={22} height={22} />,
          onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/data-preparation/local-upload") : undefined,
        },
        {
          label: "Cloud Storage Sync",
          activeChecker: () => urlParts[4] === "cloud-storage",
          icon: <IconCloudLight />,
          onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/data-preparation/cloud-storage") : undefined,
        },
        // {
        //   label: "Crawler",
        //   activeChecker: () => urlParts[4] === "crawler",
        //   icon: <IconBoldGlobal width={22} height={22} />,
        //   onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/data-preparation/crawler") : undefined,
        // },
        // {
        //   label: "Data Hubs",
        //   activeChecker: () => urlParts[4] === "data-hubs",
        //   icon: <IconShare />,
        //   onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/data-preparation/data-hubs") : undefined,
        // },
        // {
        //   label: "Crowdsource",
        //   activeChecker: () => urlParts[4] === "crowdsource",
        //   icon: <IconAddFolder />,
        //   onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/data-preparation/crowdsource") : undefined,
        // },
      ];
    }

    return null;
  }, [urlParts, withoutSteps, project, navigate]);

  const showDataPipeline = useMemo(() => {
    return project?.data_pipeline === "on" && urlParts.length > 4 && urlParts[3] === "data-preparation";
  }, [project?.data_pipeline, urlParts]);

  const isShowWorkflow = useMemo(() => {
    return (urlParts.length >= 3 && urlParts[2] === "create")
      || (
        urlParts.length > 3
        && (["project", "setup-infrastructure", "data-preparation", "setup-model", "settings", "training-dashboard", "demo-and-deploy"].includes(urlParts[3]))
      );
  }, [urlParts]);

  // const checkNextStep = useCallback(() => {
  //   onNext?.();
  //
  //   if (urlParts.length < 4 || urlParts[3] !== "data-preparation" || project?.data_pipeline === "on") {
  //     return;
  //   }
  //
  //   confirmDialog({
  //     title: "Data Pipeline",
  //     message: "Do you need a labeling tool?",
  //     submitText: "Yes",
  //     onSubmit: () => {
  //       switchDataPipeline(true);
  //       setShowPipeline(true);
  //     },
  //   });
  // }, [onNext, project?.data_pipeline, setShowPipeline, switchDataPipeline, urlParts]);

  useEffect(() => {
    const isFlowStep = project?.id
      ? (urlParts.length <= 3 || urlParts[3].length === 0)
      : (urlParts.length <= 2 || urlParts[2].length === 0);
    const isDataPage = urlParts.length > 3 && urlParts[3] === "data";
    const isCreating = urlParts.length > 2 && urlParts[2] === "create";
    const isStepPages = urlParts.length > 3 && ["project", "setup-infrastructure", "data-preparation", "setup-model"].includes(urlParts[3]);

    // Flow step: Cancel to dashboard
    if (isFlowStep) {
      setActions([
        {label: "Cancel", actionType: "dark", onClick: () => navigate("/projects")},
      ]);
    }
    // While creating project or missing storage/compute/model: Cancel to dashboard
    // Existing project: Cancel to data
    else if (isCreating || (project && isStepPages)) {
      const actions: TNavbarBreadcrumb[] = [...sharedNavbarActions];

      if (project?.data_pipeline === "on") {
        actions.push({label: "Go to Data", actionType: "primary", onClick: () => navigate("/train-and-deploy/" + project?.id + "/data")});
      } else if (permission.configure) {
        actions.push({label: "Go to Settings", actionType: "primary", onClick: () => navigate("/train-and-deploy/" + project?.id + "/settings")});
      }

      actions.push({label: "Cancel", actionType: "dark", onClick: () => navigate("/projects")});
      setActions(actions);
    }
    // Data page has its own actions and close callback
    else if (!isDataPage) {
      if (project?.data_pipeline === "on") {
        setCloseCallback("/train-and-deploy/" + project?.id + "/data");
      } else {
        setCloseCallback("/projects");
      }

      const actions: TNavbarBreadcrumb[] = [...sharedNavbarActions];

      if (permission.configure) {
        const isSettings = urlParts.length > 3 && urlParts[3] === "settings";
        actions.push({label: "Settings", actionType: isSettings ? "primary" : undefined, onClick: () => navigate("/train-and-deploy/" + project?.id + "/settings")});
      }

      const isTraining = urlParts.length > 3 && urlParts[3] === "training-dashboard";
      actions.push({label: "Training Dashboard", actionType: isTraining ? "primary" : undefined, onClick: () => navigate("/train-and-deploy/" + project?.id + "/training-dashboard")});

      const isDeploy = urlParts.length > 3 && urlParts[3] === "demo-and-deploy";
      actions.push({label: "Demo and Deploy", actionType: isDeploy ? "primary" : undefined, onClick: () => navigate("/train-and-deploy/" + project?.id + "/demo-and-deploy")});

      setActions(actions);
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

    setMeetRequirements(flowStatus.hasStorage && (flowStatus.hasAddedModel || flowStatus.hasRentedModel));
  }, [flowStatus.hasStorage, flowStatus.hasAddedModel, flowStatus.hasRentedModel, initialized, setMeetRequirements]);

  return (
    <FlowLayout
      primarySteps={isShowWorkflow || withoutSteps ? undefined : [
        {
          label: "Setup Project",
          activeChecker: () => url.startsWith("/train-and-deploy/create") || urlParts[3] === "project",
          onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/project") : undefined,
        },
        {
          label: "Setup Infrastructure",
          activeChecker: () => urlParts[3] === "setup-infrastructure",
          onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/setup-infrastructure/storage") : undefined,
        },
        {
          label: "Data Preparation",
          activeChecker: () => urlParts[3] === "data-preparation",
          onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/data-preparation/local-upload") : undefined,
        },
        {
          label: "Setup Model",
          activeChecker: () => urlParts[3] === "setup-model",
          onClick: () => project ? navigate("/train-and-deploy/" + project?.id + "/setup-model") : undefined,
        },
      ]}
      secondarySteps={withoutSteps ? undefined : secondarySteps}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
      bgColor={bgColor}
      onDataPipelineClick={showDataPipeline ? () => setShowPipeline(true) : undefined}
      flowDiagram={isShowWorkflow ? flowDiagram : undefined}
    >
      {/*{isShowWorkflow ? (
        <div className={styles.workflowWrapper}>
          <Workflow flows={flowDiagram} />
          {children}
        </div>
      ) : children}*/}
      {children}
    </FlowLayout>
  )
}
