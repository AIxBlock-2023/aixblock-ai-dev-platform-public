import React, { Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import IconArrowLeft from "@/assets/icons/IconArrowLeft";
import IconCircleChecked from "@/assets/icons/IconCircleChecked";
import { PARENT_STEPS } from "../../constants";
import { getPath, isCreateStep } from "../../utils";

const MemoizedSteps = () => {
  const location = useLocation();
  const path1 = getPath(location.pathname, 1);
  const path2 = getPath(location.pathname, 2);
  const projectId = getPath(location.pathname, 3) || path1;
  const navigate = useNavigate();

  const maxStep = path1 === "create-project" ? 0 : null;

  const activeStep = () => {
    switch (true) {
      case path1 === "create-project" || path2 === "marketplace/models":
        return "settings";
      default:
        return path2;
    }
  };

  const onSelectStep = (step: string) => {
    const isSetUpInSettings = path2 === "settings" && step === "settings";
    const isImportSetUp = path2 === "import" && step === "settings";

    if (isSetUpInSettings || isCreateStep(location)) {
      return;
    }

    if (isImportSetUp) {
      navigate(`/projects/${projectId}/settings/general`);
    } else {
      navigate(`/projects/${projectId}/import/local`);
    }
  };

  return (
    <div className="c-step parent">
      {PARENT_STEPS?.map((step, index) => (
        <Fragment key={`step-key-${step.title}`}>
          <div
            className={`c-step-item ${
              activeStep() === step.value ? "active" : ""
            } ${
              maxStep === 0 && index === 0
                ? "allow"
                : maxStep === null
                ? "allow"
                : "not-allowed"
            }`}
            key={`key-${step}`}
            onClick={() => onSelectStep(step.value)}
          >
            <div className="c-step-item__number">
              <IconCircleChecked />
            </div>
            <span className="c-step-item__title">{step.title}</span>
          </div>
          {index !== PARENT_STEPS.length - 1 && (
            <span className="c-step__line">
              <IconArrowLeft />
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );
};

const ParentStep = React.memo(MemoizedSteps);

export default ParentStep;
