import React, { useCallback, useEffect, useRef, Dispatch } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import "./UserLayout.scss";
import { Navbar, TNavbarBreadcrumb } from "../components/Navbar/Navbar";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { AccountSettingProvider } from "../providers/AccountSettingProvider";
import { useLoader } from "../providers/LoaderProvider";
import { isSetupProject } from "../pages/Project/Settings/LayoutSettings/utils";
import { useScrollbarVisibility } from "../hooks/useScrollbarVisibility";
import { infoDialog } from "../components/Dialog";
import { TProjectModel } from "../models/project";
import Alert, { AlertType } from "../components/Alert/Alert";
import { useCentrifuge } from "../providers/CentrifugoProvider";

export type TCentrifugeMsg = {
  id: number;
  type: AlertType;
  message: string;
};

export type TUserLayoutHook = {
  setOpenCart: (isEmpty: boolean) => void;
  isShowCart: boolean;
  clearLeftActions: () => void;
  setLeftActions: (breadcrumbs: TNavbarBreadcrumb[]) => void;
  clearActions: () => void;
  setActions: (breadcrumbs: TNavbarBreadcrumb[]) => void;
  setCloseCallback: (callbaclUrl: string) => void;
  clearCloseCallback: () => void;
  navProjectData: TProjectModel | null;
  setNavDataProject: (data: TProjectModel | null) => void;
  clearNavDataProject: () => void;
  setIsLayoutEmpty: (isEmpty: boolean) => void;
  clearLayoutEmpty: () => void;
  clearBreadcrumbs: () => void;
  setBreadcrumbs: (breadcrumbs: TNavbarBreadcrumb[]) => void;
  loaderFitContent: () => void;
  loaderFullWidth: () => void;
  hideInfo: () => void;
  showInfo: () => void;
  setQualityInCart: (number: number) => void;
  setExpandSideBar: Dispatch<React.SetStateAction<TSidebar>>;
};

export type TSidebar = {
  isExpand: boolean;
  sideBarW: number;
};

const UserLayoutContext = React.createContext<TUserLayoutHook>({
  clearLeftActions: () => void 0,
  setLeftActions: () => void 0,
  clearActions: () => void 0,
  setActions: () => void 0,
  setCloseCallback: () => void 0,
  clearCloseCallback: () => void 0,
  navProjectData: null,
  setNavDataProject: () => void 0,
  clearNavDataProject: () => void 0,
  setIsLayoutEmpty: () => void 0,
  clearLayoutEmpty: () => void 0,
  clearBreadcrumbs: () => void 0,
  setBreadcrumbs: () => void 0,
  loaderFitContent: () => void 0,
  loaderFullWidth: () => void 0,
  hideInfo: () => void 0,
  showInfo: () => void 0,
  isShowCart: false,
  setOpenCart: () => void 0,
  setQualityInCart: () => void 0,
  setExpandSideBar: () => void 0,
});

export default function UserLayout() {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbsState] = React.useState<
    TNavbarBreadcrumb[] | null
  >(null);
  const [leftActions, setLeftActionsState] = React.useState<
    TNavbarBreadcrumb[] | null
  >(null);
  const [actions, setActionsState] = React.useState<TNavbarBreadcrumb[] | null>(
    null
  );
  const [isShowCart, setIsShowCart] = React.useState(false);
  const [qualityInCart, setQualityInCart] = React.useState(0);
  const [closeCallBackUrl, setShowCloseCallBack] = React.useState<
    string | null
  >(null);
  const { onMessage } = useCentrifuge();
  const [alerts, setAlerts] = React.useState<Array<TCentrifugeMsg>>([]);

  const [isInfoShowed, setIsInfoShowed] = React.useState<boolean>(true);
  const [isLayoutEmpty, setIsLayoutEmptyState] = React.useState<boolean>(false);
  const [navProjectData, setNavProjectData] =
    React.useState<TProjectModel | null>(null);
  const { setLeft, setTop } = useLoader();
  const [sideBarData, setExpandSideBar] = React.useState<TSidebar>({
    isExpand: true,
    sideBarW: 300,
  });

  const outletRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollbarVisible = useScrollbarVisibility(contentRef, outletRef);

  const isSetupPage = isSetupProject(location.pathname);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hideInfo = React.useCallback(() => {
    setIsInfoShowed(false);
  }, []);
  const showInfo = React.useCallback(() => {
    setIsInfoShowed(true);
  }, []);

  const clearLeftActions = React.useCallback(() => {
    setLeftActionsState(null);
  }, []);

  const setLeftActions = React.useCallback((actions: TNavbarBreadcrumb[]) => {
    setLeftActionsState(actions);
  }, []);

  const clearActions = React.useCallback(() => {
    setActionsState(null);
  }, []);

  const setActions = React.useCallback((actions: TNavbarBreadcrumb[]) => {
    setActionsState(actions);
  }, []);

  const clearCloseCallback = React.useCallback(() => {
    setShowCloseCallBack(null);
  }, []);

  const setCloseCallback = React.useCallback((callBackUrl: string) => {
    setShowCloseCallBack(callBackUrl);
  }, []);

  const clearNavDataProject = React.useCallback(() => {
    setNavProjectData(null);
  }, []);

  const setNavDataProject = React.useCallback((data: TProjectModel | null) => {
    setNavProjectData(data);
  }, []);

  const clearLayoutEmpty = React.useCallback(() => {
    setIsLayoutEmptyState(false);
  }, []);

  const setIsLayoutEmpty = React.useCallback((isEmpty: boolean) => {
    setIsLayoutEmptyState(isEmpty);
  }, []);

  const clearBreadcrumbs = React.useCallback(() => {
    setBreadcrumbsState(null);
  }, []);

  const setBreadcrumbs = React.useCallback(
    (breadcrumbs: TNavbarBreadcrumb[]) => {
      setBreadcrumbsState(breadcrumbs);
    },
    []
  );

  const setOpenCart = React.useCallback((isOpen: any) => {
    setIsShowCart(isOpen);
  }, []);

  // Update position layout user: top, left, right, bottom  => 12px
  const loaderFitContent = React.useCallback(() => {
    setLeft(sideBarData.sideBarW + 12 + 2);
    setTop(70 + 13);
  }, [setLeft, setTop, sideBarData.sideBarW]);

  const loaderFullWidth = React.useCallback(() => {
    setLeft(14);
    setTop(70 + 13);
  }, [setLeft, setTop]);

  useEffect(() => {
    if (location.pathname.startsWith("/admin") && !user?.is_superuser) {
      navigate("/dashboard/");
    } else if (
      location.pathname.startsWith("/user/organization") &&
      !user?.is_organization_admin
    ) {
      navigate("/dashboard/");
    }
  }, [
    location.pathname,
    navigate,
    user?.is_organization_admin,
    user?.is_superuser,
  ]);

  const isFirstLogin =
    (localStorage.getItem("isSignUpSuccess") ?? "") === "true";

  useEffect(() => {
    if (!isFirstLogin || location.pathname.startsWith("/first-time")) {
      return;
    }

    navigate("/first-time");
  }, [isFirstLogin, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname.startsWith("/workflows/flows")) {
      const match = location.pathname.match(
        /^\/workflows\/flows\/([^/]+)\/step\/([^/]+)$/
      );
      if (match) {
        setExpandSideBar((prev) => ({ ...prev, isExpand: false }));
      }
    }
  }, [location, setExpandSideBar]);

  const providerValue = React.useMemo<TUserLayoutHook>(() => {
    return {
      clearLeftActions,
      setLeftActions,
      clearActions,
      setActions,
      setCloseCallback,
      clearCloseCallback,
      navProjectData,
      clearNavDataProject,
      setNavDataProject,
      setIsLayoutEmpty,
      clearLayoutEmpty,
      clearBreadcrumbs,
      setBreadcrumbs,
      loaderFitContent,
      loaderFullWidth,
      hideInfo,
      showInfo,
      setOpenCart,
      isShowCart,
      setQualityInCart,
      setExpandSideBar,
    };
  }, [
    clearLeftActions,
    setLeftActions,
    clearActions,
    setActions,
    setCloseCallback,
    clearCloseCallback,
    navProjectData,
    clearNavDataProject,
    setNavDataProject,
    setIsLayoutEmpty,
    clearLayoutEmpty,
    clearBreadcrumbs,
    setBreadcrumbs,
    loaderFitContent,
    loaderFullWidth,
    hideInfo,
    showInfo,
    setOpenCart,
    isShowCart,
    setQualityInCart,
  ]);

  React.useEffect(() => {
    if (!user) navigate("/user/login");
  }, [navigate, user]);

  React.useEffect(() => {
    !isSetupPage && loaderFitContent();

    return () => {
      loaderFullWidth();
    };
  }, [loaderFitContent, loaderFullWidth, isSetupPage]);

  React.useEffect(() => {
    if (user && !user?.is_active) {
      logout(true);
      infoDialog({
        message: "Your account is deactive, please contact admin!",
      });
    }
  }, [user, logout]);

  // Message handler
  // const handleMessage = useCallback((message: TCentrifugeMsg) => {
  //   console.log("Received message:", message);
  //   if(message.type){
  //     setMsgType(message.type)
  //   }
  //   if(message.message){
  //     setAlertMessage(message.message)
  //   }
  //   setTimeout(() => {
  //     setAlertMessage("");
  //     setMsgType(AlertType.Default);
  //   }, 3000);

  // }, []);
  const handleMessage = useCallback((message: TCentrifugeMsg) => {
    const { type, message: msg } = message;
    const id = Date.now(); // Use a timestamp or any unique value as ID

    // Add the new alert to the state with an ID
    setAlerts((prevAlerts) => [...prevAlerts, { id, type, message: msg }]);

    // Set a timeout to remove this specific alert after 30 seconds
    const timerId = setTimeout(() => {
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== id));
    }, 5000); // Dismiss each alert after 30 seconds

    // Optionally store timerId if you need to clear it later
    timers.current[id] = timerId;
  }, []);

  const timers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (user) {
      const userTopic = `user-notification/${user.uuid}`;
      const unsubscribe = onMessage(userTopic, handleMessage as any);
      return () => {
        unsubscribe();
      };
    }
    const timersSnapshot = { ...timers.current };
    return () => {
      // Clear all timeouts using the snapshot
      Object.values(timersSnapshot).forEach(clearTimeout);
    };
  }, [user, onMessage, handleMessage]);

  if (!user) {
    return null;
  }

  if (isFirstLogin && !location.pathname.startsWith("/first-time")) {
    return null;
  }

  return (
    <UserLayoutContext.Provider value={providerValue}>
      <div className={`layout-user ${isLayoutEmpty ? "empty" : ""}`}>
        <Navbar
          isInfoShowed={isInfoShowed}
          leftActions={leftActions}
          actions={actions}
          breadcrumbs={breadcrumbs}
          user={user}
          sideBarData={sideBarData}
          onExpandSideBar={setExpandSideBar}
          isSetupPage={isSetupPage}
          isLayoutEmpty={isLayoutEmpty}
          navProjectData={navProjectData}
          closeCallBackUrl={closeCallBackUrl}
          isShowCart={isShowCart}
          setIsShowCart={setOpenCart}
          qualityInCart={qualityInCart}
        />
        <div
          className={`layout-user__split ${
            sideBarData.isExpand ? "expand" : "close"
          }`}
        >
          {!isSetupPage && sideBarData.isExpand && (
            <div
              className="layout-user__sidebar"
              style={{ width: sideBarData.sideBarW }}
            >
              <Sidebar isExpand={sideBarData.isExpand} />
            </div>
          )}
          <AccountSettingProvider>
            <div
              className={`layout-user__content ${
                !sideBarData.isExpand ? "close" : "open"
              } ${isScrollbarVisible ? "scrollbar" : "auto"} ${
                !isSetupPage ? "fit" : "full"
              }`}
              style={
                !isSetupPage
                  ? {
                      marginLeft: sideBarData.isExpand
                        ? sideBarData.sideBarW
                        : 0,
                      width: `calc(100% - ${
                        sideBarData.isExpand ? sideBarData.sideBarW + 26 : 26
                      }px)`,
                    }
                  : {}
              }
              ref={contentRef}
            >
              <div className="layout-user__outlet" ref={outletRef}>
                <Outlet />
              </div>
            </div>
          </AccountSettingProvider>
        </div>
        <div className="notification">
          {alerts.map((alert, index) => (
            <Alert key={index} type={alert.type} message={alert.message} />
          ))}
        </div>
      </div>
    </UserLayoutContext.Provider>
  );
}

export function useUserLayout() {
  return React.useContext(UserLayoutContext);
}
