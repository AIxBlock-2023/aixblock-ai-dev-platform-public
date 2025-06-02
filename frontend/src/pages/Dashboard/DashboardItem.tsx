import { useNavigate } from "react-router-dom";
import styles from "./Dashboard.module.scss";
import { ReactNode, useMemo, useState } from "react";
import { reactNodeToText } from "@/utils/reactNodeToText";

export type DashboardItem = {
  index: number,
  title: ReactNode,
  subTitle: ReactNode,
  icon?: JSX.Element,
  url?: string,
  count?: number,
  disabled?: boolean,
}

type TDashboardItemProp = {
  data: DashboardItem,
  toggleableDesc?: boolean,
}

const DashBoardItem = ({ data, toggleableDesc }: TDashboardItemProp) => {
  const navigate = useNavigate();
  const subTitleStr = useMemo(() => reactNodeToText(data.subTitle), [data.subTitle]);
  const toggleable = useMemo(() => toggleableDesc && subTitleStr.length > 60, [subTitleStr.length, toggleableDesc]);
  const [expanded, setExpanded] = useState(false);

  const content = useMemo(() => {
    if (!toggleable) {
      return <h4 className={ styles.dashboardItemSubtitle }>{ data.subTitle }</h4>;
    }

    return (
      <h4 className={ styles.dashboardItemSubtitle }>
        { expanded ? data.subTitle : subTitleStr.substring(0, 60) + "..." }
        &nbsp;
        <span
          className={styles.moreLess}
          onClick={ev => {
            ev.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          { expanded ? "Less" : "More" }
        </span>
      </h4>
    );
  }, [data.subTitle, expanded, subTitleStr, toggleable]);

  return (
    <div
      className={ styles.dashboardItem + (data.disabled ? " " + styles.dashboardItemDisabled : "")}
      key={`dashboard-item-${data.index}`}
      onClick={data.disabled || !data.url ? undefined : () => {
        if (data.url?.startsWith("http://") || data.url?.startsWith("https://")) {
          window.open(data.url);
        } else {
          navigate(data.url ?? "");
        }
      }}
    >
      {data.icon ?
        <div className="dashboard__item-icon">
          {data.icon}
        </div> : (
          <div className={styles.dashboardItemCountNumber}>
            {data.count ?? 0}
          </div>
        )
      }
      <div className={styles.dashboardItemContent}>
        <h4 className={styles.dashboardItemTitle}>{data.title}</h4>
        {content}
      </div>
    </div>
  );
};

export default DashBoardItem;
