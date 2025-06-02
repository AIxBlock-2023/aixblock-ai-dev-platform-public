import React, { Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import IconCircleChecked from "@/assets/icons/IconCircleChecked";
import { CHILDREN_STEPS } from "../../constants";
import { getPath, isCreateStep } from "../../utils";

const MemoizedSteps = () => {
  const location = useLocation();
  const path = getPath(location.pathname, 1);
  const path2 = getPath(location.pathname, 2);
  const projectId = getPath(location.pathname, 3) || path;
  const navigate = useNavigate();
  
  const onSelectStep = (value: string) => {
    !isCreateStep(location) &&
      projectId &&
      navigate(`/projects/${projectId}/settings/${value}`);
  };

  const maxStep = path === "create-project" ? 0 : null;

  const activeStep = () => {
    switch (true) {
      case path === "create-project":
        return "general";
      case path2 === "marketplace/models":
        return "ml";
      default:
        return path;
    }
  };

  return (
    <div className="c-step children">
      {CHILDREN_STEPS?.map((step, index) => (
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
            key={`key-${step.title}`}
            onClick={() => onSelectStep(step.value)}
          >
            <div className="c-step-item__number">
              {(maxStep === 0 && index === 0) || maxStep === null ? (
                <IconCircleChecked />
              ) : (
                <span className="ellipse" />
              )}
            </div>
            <span className="c-step-item__title">{step.title}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
};

const ChildrenStep = React.memo(MemoizedSteps);

export default ChildrenStep;
