import React from "react";
import {useLocation, useNavigate} from "react-router-dom";
import styles from "./Tabs.module.scss";

export type TTab = {
  label: string,
  urlKey: string,
}

export type TPrimaryTab = TTab & {
  children?: TTab[],
}

export type TTabs = TPrimaryTab[]

export const LIST_TABS: TTabs = [
  {
    label: "Workflow",
    urlKey: "workflow",
  },
  {
    label: "Compute",
    urlKey: "computes",
  },
  {
    label: "Model",
    urlKey: "models",
  },
  
]

export default function Tabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParts = React.useMemo(() => location.pathname.split("/"), [location.pathname]);
  const firstPart = React.useMemo(() => urlParts.length > 2 ? urlParts[2] : undefined, [urlParts]);

  const tabs = React.useMemo(() => {
    return LIST_TABS;
  }, []);

  const activeIndex = React.useMemo(() => {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].urlKey === firstPart) {
        return i;
      }
    }

    return -2;
  }, [firstPart, tabs]);


  return (
    <>
      <div className={styles.primaryTabs}>
        {tabs.map((t, i) => (
          <span
            key={"primary-tab-" + t.urlKey}
            className={[
              styles.primaryTabItem,
              t.urlKey === firstPart ? styles.primaryTabItemActive : "",
              activeIndex === i + 1 ? styles.primaryTabItemCornerRight : "",
              activeIndex === i - 1 ? styles.primaryTabItemCornerLeft : "",
            ].join(" ")}
            onClick={() => {
              if (t.children) {
                navigate("/marketplace/" + t.urlKey + "/" + t.children[0].urlKey);
              } else {
                navigate("/marketplace/" + t.urlKey);
              }
            }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </>
  );
}
