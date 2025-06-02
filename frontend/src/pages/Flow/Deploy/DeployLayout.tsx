import React, {useEffect, useMemo} from "react";
import FlowLayout, {TProps as TFlowLayoutProps} from "../Shared/FlowLayout";
import {useLocation, useNavigate} from "react-router-dom";
import {useFlowProvider} from "../FlowProvider";
import {useUserLayout} from "@/layouts/UserLayout";
// import {IconData} from "@/assets/icons/Index";
// import IconCpu from "@/assets/icons/IconCpu";
import {useFlowDiagramUpdate} from "./hooks";
import {TNavbarBreadcrumb} from "@/components/Navbar/Navbar";

export type TProps = React.PropsWithChildren<Pick<TFlowLayoutProps, "onBack" | "onSkip" | "onNext" | "bgColor">> & {
  withoutSteps?: boolean,
}

export default function DeployLayout({children, onBack, onSkip, onNext, withoutSteps, bgColor}: TProps) {
  const navigate = useNavigate();
  const {pathname: url} = useLocation();
  const {project, flowStatus, isMeetRequirements, setMeetRequirements, initialized, flowDiagram, permission, sharedNavbarActions} = useFlowProvider();
  const {setActions, clearActions, setCloseCallback, clearCloseCallback} = useUserLayout();
  useFlowDiagramUpdate();

  const urlParts = useMemo(() => {
    return url.split("/");
  }, [url]);

  // const secondarySteps = useMemo(() => {
  //   if (withoutSteps) {
  //     return;
  //   }
  //
  //   if (urlParts[3] === "setup-infrastructure") {
  //     return [
  //       {
  //         label: "Storage",
  //         activeChecker: () => urlParts[4] === "storage",
  //         icon: <IconData />,
  //         onClick: () => project ? navigate("/deploy/" + project?.id + "/setup-infrastructure/storage") : undefined,
  //       },
  //       {
  //         label: "GPU for training and deploying",
  //         activeChecker: () => urlParts[4] === "gpu",
  //         icon: <IconCpu />,
  //         onClick: () => project ? navigate("/deploy/" + project?.id + "/setup-infrastructure/gpu") : undefined,
  //       },
  //     ];
  //   }
  //
  //   return null;
  // }, [urlParts, withoutSteps, project, navigate]);

  const isShowWorkflow = useMemo(() => {
    if (urlParts.length > 4 && urlParts[4] === "marketplace") {
      return false;
    }

    return (urlParts.length >= 3 && urlParts[2] === "create")
      || (
        urlParts.length > 3
        && (["project", "setup-infrastructure", "data-preparation", "setup-model", "settings", "training-dashboard", "demo-and-deploy"].includes(urlParts[3]))
      );
  }, [urlParts]);

  useEffect(() => {
    const isFlowStep = project?.id
      ? (urlParts.length <= 3 || urlParts[3].length === 0)
      : (urlParts.length <= 2 || urlParts[2].length === 0);
    const isCreating = urlParts.length > 2 && urlParts[2] === "create";
    const isStepPages = urlParts.length > 3 && ["project", "setup-infrastructure", "setup-model"].includes(urlParts[3]);
    const isModelMarketplace = urlParts.length > 4 && urlParts[4] === "marketplace";

    // Model marketplace
    if (isModelMarketplace) {
      setActions([
        ...sharedNavbarActions,
        {label: "Back", actionType: "dark", onClick: () => navigate("/deploy/" + project?.id + "/setup-model")},
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
              {label: "Go to Deploy", actionType: "primary", onClick: () => navigate("/deploy/" + project?.id + "/demo-and-deploy")},
              {label: "Cancel", actionType: "dark", onClick: () => navigate("/projects")},
            ]
        ) as TNavbarBreadcrumb[],
      ]);
    }
    else {
      setCloseCallback("/projects/");
      const actions: TNavbarBreadcrumb[] = [...sharedNavbarActions];

      if (permission.configure) {
        const isSettings = urlParts.length > 3 && urlParts[3] === "settings";
        actions.push({label: "Settings", actionType: isSettings ? "primary" : undefined, onClick: () => navigate("/deploy/" + project?.id + "/settings")});
      }

      const isDeploy = urlParts.length > 3 && urlParts[3] === "demo-and-deploy";
      actions.push({label: "Demo and Deploy", actionType: isDeploy ? "primary" : undefined, onClick: () => navigate("/deploy/" + project?.id + "/demo-and-deploy")});

      setActions(actions);
    }

    return () => {
      clearActions();
      clearCloseCallback();
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
          activeChecker: () => url.startsWith("/deploy/create") || urlParts[3] === "project",
          onClick: () => project ? navigate("/deploy/" + project?.id + "/project") : undefined,
        },
        {
          label: "Setup Infrastructure",
          activeChecker: () => urlParts[3] === "setup-infrastructure",
          onClick: () => project ? navigate("/deploy/" + project?.id + "/setup-infrastructure/gpu") : undefined,
        },
        {
          label: "Setup Model",
          activeChecker: () => urlParts[3] === "setup-model",
          onClick: () => project ? navigate("/deploy/" + project?.id + "/setup-model") : undefined,
        },
      ]}
      // secondarySteps={withoutSteps ? undefined : secondarySteps}
      onBack={onBack}
      onSkip={onSkip}
      onNext={onNext}
      bgColor={bgColor}
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
