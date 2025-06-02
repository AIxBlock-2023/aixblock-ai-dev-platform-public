import React, { useEffect, useMemo } from "react";
import { IconPlay } from "@/assets/icons/Index";
import { infoDialog } from "@/components/Dialog";
import { TNavbarBreadcrumb } from "@/components/Navbar/Navbar";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import {
  DASHBOARD_COMPUTES,
  DASHBOARD_CREATE,
  DASHBOARD_MARKETPLACES,
} from "@/constants/dashboardContent";
import { VIDEO_URL } from "@/constants/projectConstants";
import { useUserLayout } from "@/layouts/UserLayout";
import styles from "./Dashboard.module.scss";
import DashBoardItem from "./DashboardItem";
import { useLocation } from "react-router-dom";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";
import { useDashboardCalculate } from "@/hooks/dashboard/useDashboardCalculate";

const DashboardPage = () => {
  const userLayout = useUserLayout();
  const {state} = useLocation();
  const { data } = useDashboardCalculate();

  useEffect(() => {
    const actions: TNavbarBreadcrumb[] = [
      {
        icon: <IconPlay />,
        label: "Watch demo video",
        onClick: () => {
          infoDialog({
            cancelText: null,
            className: "model-demo-video",
            message: (
              <VideoPlayer url={VIDEO_URL.WATCH_DEMO} />
            ),
          });
        },
        actionType: "outline",
        class: "watch-demo-video"
      },
    ]
    userLayout.setBreadcrumbs([{ label: "Dashboard" }]);
    userLayout.setActions(actions ?? []);
    return () => {
      userLayout.clearBreadcrumbs();
      userLayout.clearActions();
    }
  }, [userLayout]);

  const computes = useMemo(() => {
    return DASHBOARD_COMPUTES.map((item) => {
      if (item.index === 6) {
        return {
          ...item,
          count: data?.rented_models_count ?? 0,
        };
      } else if (item.index === 3) {
        return { ...item, count: data?.rented_compute_count ?? 0 };
      }

      return item;
    });

  }, [data]);

  useDebouncedEffect(() => {
    if (!state?.showWelcome) {
      return;
    }

    const timeout = setTimeout(() => {
      infoDialog({
        title: "Thank you for choosing AIxBlock!",
        message: (
          <span>
            We hope you enjoy using our platform and look forward to continuing to provide you with excellent service.
            <br/>
            <b>Disclaimer</b><br/>
            Our platform is currently in the BETA stage, which means that we are still in the process of testing and improving it.
            Please note that while we are doing our best to make sure the app is safe and functional, there may be some bugs and issues that we haven't discovered yet. As with any BETA product, use at your own discretion.
            We appreciate your understanding and support as we work to make AIxBlock even better. If you encounter any problems or have suggestions for improvement, please don't hesitate to reach out to us. We're here to help!
          </span>
        )
      })
    }, 1000);

    return () => {
      clearTimeout(timeout);
    }
  }, []);

  return (
    <div className={styles.pDashboard}>
      <div className={styles.pDashboardCol}>
        <h3 className={styles.pDashboardTitle}>Dashboard</h3>
        {computes.map((item) => (
          <DashBoardItem data={item} key={"compute-" + item.index}/>
        ))}
      </div>
      <div className={styles.pDashboardCol}>
        <h3 className={styles.pDashboardTitle}>Create a project</h3>
        {DASHBOARD_CREATE.map((item) => (
          <DashBoardItem data={item} key={"flow-" + item.index} toggleableDesc={item.index !== 6} />
        ))}
      </div>
      <div className={styles.pDashboardCol}>
        <h3 className={styles.pDashboardTitle}>Marketplace</h3>
        {DASHBOARD_MARKETPLACES.map((item) => (
          <DashBoardItem data={item} key={"model-" + item.index}/>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
