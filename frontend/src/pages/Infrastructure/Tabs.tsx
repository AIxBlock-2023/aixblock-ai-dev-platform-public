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
    label: "Server to host platform",
    urlKey: "platform",
  },
  {
    label: "Storage",
    urlKey: "storage",
    children: [
      {label: "Cloud Storage", urlKey: "cloud"},
      {label: "Self host", urlKey: "self-host"},
    ]
  },
  {
    label: "GPU for model training and deployment",
    urlKey: "gpu",
    children: [
      {label: "Your own", urlKey: "self-host"},
      {label: "From marketplace", urlKey: "from-marketplace"},
    ],
  },
  {
    label: "My compute listings",
    urlKey: "compute-listings",
    children: [
      {label: "List", urlKey: ""},
      {label: "Earnings", urlKey: "earnings"},
    ],
  },
]

export const SETUP_TABS: TTabs = [
  {
    label: "Server to host platform",
    urlKey: "setup-platform",
  },
  {
    label: "Storage",
    urlKey: "setup-storage",
    children: [
      {label: "Cloud Storage", urlKey: "cloud"},
      {label: "Self host", urlKey: "self-host"},
    ]
  },
  {
    label: "GPU for model training and deployment",
    urlKey: "setup-gpu",
    children: [
      {label: "Your own", urlKey: "self-host"},
      {label: "From marketplace", urlKey: "from-marketplace"},
    ],
  },
  {
    label: "List my compute",
    urlKey: "list-compute",
  },
]

export default function Tabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const urlParts = React.useMemo(() => location.pathname.split("/"), [location.pathname]);
  const firstPart = React.useMemo(() => urlParts.length > 2 ? urlParts[2] : undefined, [urlParts]);
  const secondPart = React.useMemo(() => urlParts.length > 3 ? urlParts[3] : undefined, [urlParts]);

  const isSetup = React.useMemo(() => firstPart && ["setup-platform", "setup-storage", "setup-gpu", "list-compute"].includes(firstPart), [firstPart]);

  const tabs = React.useMemo(() => {
    return isSetup ? SETUP_TABS : LIST_TABS;
  }, [isSetup]);

  const activeIndex = React.useMemo(() => {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].urlKey === firstPart) {
        return i;
      }
    }

    return -2;
  }, [firstPart, tabs]);

  const childTabs = React.useMemo(() => {
    if (!isSetup) {
      return [];
    }

    return tabs.find(t => t.urlKey === firstPart)?.children ?? [];
  }, [firstPart, isSetup, tabs]);

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
                navigate("/infrastructure/" + t.urlKey + "/" + t.children[0].urlKey);
              } else {
                navigate("/infrastructure/" + t.urlKey);
              }
            }}
          >
            {t.label}
          </span>
        ))}
      </div>
      {childTabs.length > 0 && (
        <div className={styles.secondaryTabs}>
          {childTabs.map((t, i) => (
            <span
              key={"secondary-tab-" + t.urlKey}
              className={[
                styles.secondaryTabItem,
                t.urlKey === secondPart ? styles.secondaryTabItemActive : "",
              ].join(" ")}
              onClick={() => {
                if (isSetup && firstPart === "setup-gpu" && t.urlKey === "from-marketplace") {
                  navigate("/marketplace/computes")
                } else {
                  navigate("/infrastructure/" + firstPart + "/" + t.urlKey);
                }
              }}
            >
              <svg width="13" height="12" viewBox="0 0 13 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6" r="6" fill="currentColor"/>
              </svg>
              {t.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
