import { useLocation } from "react-router-dom";
import { getPath, isCreateStep } from "../utils";
import ChildrenStep from "./ChildrenSteps/Index";
import ImportStep from "./ImportSteps/Index";
import "./Index.scss";
import ParentStep from "./ParentSteps/Index";
import { DATATYPE } from "../../Index";
import { Dispatch, SetStateAction } from "react";

export type TImportDataType = {
  importDataType?: DATATYPE;
  setImportDataType?:  Dispatch<SetStateAction<DATATYPE>>
}

const HeaderSettings = (props: TImportDataType) => {
  const location = useLocation();
  const isChildrenStep = () => {
    switch (getPath(location.pathname, 2)) {
      case "settings":
        return true;
      case "models-marketplace":
        return true;
      case "marketplace/models":
          return true;
      default:
        break;
    }
  };

  return (
    <div className="c-header-settings">
      <ParentStep />
      {isChildrenStep() || isCreateStep(location) ? (
        <ChildrenStep />
      ) : (
        <ImportStep importDataType={props.importDataType} setImportDataType={props.setImportDataType} />
      )}
    </div>
  );
};

export default HeaderSettings;
