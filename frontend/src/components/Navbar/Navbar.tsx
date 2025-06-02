import React, {
  Dispatch,
  SetStateAction,
  useState,
  useRef,
  useCallback,
  useMemo,
  Suspense, useEffect,
} from "react";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { TUserModel } from "@/models/user";
import "./Navbar.scss";
import {
  IconExpand,
  IconEdit,
  IconClose,
  IconMenu,
} from "@/assets/icons/Index";
import { TSidebar, useUserLayout } from "@/layouts/UserLayout";
import Breadcrumbs from "../Breadcrumbs/Breadcrumbs";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarActions from "../NavbarActions/NavbarActions";
import { TProjectModel } from "@/models/project";
import { useCreateProject } from "@/hooks/project/create/useCreateProject";
import Modal from "../Modal/Modal";
import InputBase from "../InputBase/InputBase";
import { createAlert } from "@/utils/createAlert";
import { isCreateStep } from "@/pages/Project/Settings/LayoutSettings/utils";
import Spin from "../Spin/Spin";
import AppLoading from "../AppLoading/AppLoading";
import IconCart from "@/assets/icons/IconCart";
import { userRoles } from "@/utils/user";

export type TNavbarBreadcrumb = {
  label: string | React.ReactNode;
  onClick?: () => void;
  actionType?: "danger" | "success" | "warning" | "primary" | "link" | "outline" | "dark" | "primary2";
  icon?: JSX.Element;
  look?: string;
  class?: string;
};

export type TNavbarProjectData = {
  name: string | undefined;
  desc: string | undefined;
};

export type TProps = {
  isInfoShowed?: boolean;
  leftActions?: TNavbarBreadcrumb[] | null;
  actions?: TNavbarBreadcrumb[] | null;
  breadcrumbs?: TNavbarBreadcrumb[] | null;
  user?: TUserModel | undefined;
  sideBarData: TSidebar;
  isSetupPage?: boolean;
  isLayoutEmpty?: boolean;
  navProjectData?: TProjectModel | null;
  closeCallBackUrl?: string | null;
  onExpandSideBar: Dispatch<SetStateAction<TSidebar>>;
  isShowCart?: boolean;
  setIsShowCart?: (isShowCart: boolean) => void;
  qualityInCart: number
};

const MemoizedNavbar = (props: TProps) => {
  const {
    sideBarData,
    isSetupPage,
    isLayoutEmpty,
    navProjectData,
    closeCallBackUrl,
    onExpandSideBar,
    isInfoShowed,
    isShowCart = false,
    setIsShowCart = () => { },
    qualityInCart
  } = props;
  const [isShowListNotification, setIsShowListNotification] = useState(false);
  const [isShowMenu, setMenuShow] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const dropdownNotificationRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isShowModelUpdateName, setShowModelUpdateName] =
    useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>("");
  const userLayout = useUserLayout();

  const {
    error,
    loading: loadingUpdateProjectName,
    validationErrors,
    onCreate: onUpdate,
  } = useCreateProject({ ...(navProjectData ?? {}), title: projectName });

  useEffect(() => {
    setProjectName(navProjectData?.title ?? "");
  }, [navProjectData]);

  const getUserRole = useMemo(() => {
    switch (true) {
      case props.user?.is_compute_supplier:
        return "Compute supplier";
      case props.user?.is_model_seller:
        return "Model Seller";
      case props.user?.is_labeler:
        return "Labeler";
      default:
        return "AI Developer & AI Adopter";
    }
  }, [props.user?.is_compute_supplier, props.user?.is_model_seller, props.user?.is_labeler]);

  const handleExpandSideBar = () => {
    onExpandSideBar({
      ...sideBarData,
      isExpand: !sideBarData.isExpand,
      sideBarW: sideBarData.isExpand ? 67 : 300,
    });
  };

  // const account = React.useMemo(() => {
  //   if (!props.user) {
  //     return null;
  //   }

  //   return <div className="c-navbar__account">{props.user.avatar ? "" : props.user.initials}</div>;
  // }, [props.user]);

  // const handleDropdownClick = () => {
  //   setMenuShow(!isShowMenu);
  // };

  const handleClickOutside = useCallback(() => {
    if (!dropdownRef.current || !isShowMenu) return false;
    setMenuShow(false);
  }, [isShowMenu]);

  // const goToAccountSettings = () => {
  //   navigate('/user/account');
  //   setMenuShow(false);
  // }

  useOnClickOutside(dropdownRef, handleClickOutside);

  // const handleShowListNotification = () => {
  //   setIsShowListNotification(!isShowListNotification);
  // };

  const handleClickOutsideListNotification = useCallback(() => {
    if (!dropdownNotificationRef.current || !isShowListNotification)
      return false;
    setIsShowListNotification(false);
  }, [isShowListNotification]);
  useOnClickOutside(
    dropdownNotificationRef,
    handleClickOutsideListNotification
  );

  const handleFieldChange = useCallback((value: string) => {
    setProjectName(value);
  }, []);

  const onUpdateProjectName = useCallback(() => {
    onUpdate(navProjectData?.id).then((res) => {
      if (res) {
        userLayout.setNavDataProject(res);
        setShowModelUpdateName(false);
      }
    });
  }, [onUpdate, navProjectData?.id, userLayout]);

  const errorNode = useMemo(() => {
    return createAlert(error, undefined, false, {
      marginBottom: 16,
    });
  }, [error]);

  return (
    <div className="c-navbar">
      <div className="c-navbar__wrapper">
        <div className="c-navbar__left">
          <div className="c-navbar__logo">
            {sideBarData.isExpand &&
              <img
                className="c-navbar__logo-image"
                src={require("@/assets/images/logo.png")}
                height={30}
                alt="Logo"
                onClick={() => navigate("/dashboard/")}
                style={{cursor: "pointer"}}
              />
            }
            <div className="c-navbar__logo-info">
              {isInfoShowed && sideBarData.isExpand && (
                <div
                  className={`c-navbar__user-info ${
                    isSetupPage ? "settings" : ""
                  }`}
                >
                  <span>
                    {navProjectData && isSetupPage
                      ? navProjectData.title
                      : getUserRole}
                  </span>
                  <strong>
                    {navProjectData && isSetupPage
                      ? navProjectData.label_config_title
                      : userRoles(props.user as any) + " - " +props.user?.username}
                  </strong>
                </div>
              )}

              {!isSetupPage && (
                <button
                  className="c-navbar__icon-hamburger"
                  onClick={() => handleExpandSideBar()}
                >
                  {sideBarData.isExpand ? (
                    <IconExpand color={"#5050FF"} />
                  ) : (
                    <IconMenu />
                  )}
                </button>
              )}
              {isSetupPage && isInfoShowed &&
                location.pathname !== "/wallet" &&
                !isCreateStep(location) && navProjectData && (
                  <button
                    className="c-navbar__icon-settings-edit"
                    onClick={() => setShowModelUpdateName(true)}
                  >
                    <IconEdit width={16} height={16} />
                  </button>
                )}
              {!isLayoutEmpty &&
                props.leftActions &&
                props.leftActions.length > 0 && (
                  <ul className="c-navbar__actions-items">
                    <NavbarActions data={props.leftActions} />
                  </ul>
                )}
            </div>
          </div>
          {!isLayoutEmpty &&
            !isSetupPage &&
            location.pathname !== "/wallet" && (
              <>
                <div className="line" />
                <div className="c-navbar__breadcrumbs">
                  <ul className="c-navbar__breadcrumbs-items">
                    <Breadcrumbs data={props.breadcrumbs} />
                  </ul>
                </div>
              </>
            )}
        </div>
        <div className="c-navbar__right">
          {!isLayoutEmpty && (
            <div className="c-navbar__actions">
              {location.pathname === '/marketplace/computes' ?
                <div className="cart-block" onClick={() => {
                  setIsShowCart(!isShowCart)
                }}>
                  <IconCart />
                  <p className="cart-block--title">Your cart</p>
                  <p className="cart-block--quality">({qualityInCart})</p>
                </div>
                : null /*<Button
                className="c-navbar__icon-book"
                type="secondary"
                icon={<IconBook />}
                onClick={() => navigate("/document")}
              >
                Tutorial
              </Button>*/}
              {/* <Button
                className="c-navbar__icon-book"
                type="secondary"
                icon={<IconBook />}
                onClick={() => navigate("/document")}
              >
                Tutorial
              </Button> */}
              {props.actions && props.actions.length > 0 && (
                <ul className="c-navbar__actions-items">
                  <NavbarActions data={props.actions} />
                </ul>
              )}
              {closeCallBackUrl && (
                <>
                  <div className="line" />
                  <button
                    className="c-navbar__icon-close-callback"
                    onClick={() => navigate(closeCallBackUrl)}
                  >
                    <IconClose />
                  </button>
                </>
              )}
            </div>
          )}
          <>
            {/** Todo: Wait a new design for notification and switcher account components */}
            {/* <div className="c-navbar__notification" ref={dropdownNotificationRef}>
            <button
              className="c-navbar__notification-button"
              onClick={handleShowListNotification}
            >
              <IconNotification />
              {(hasNew || unreadCount > 0) && <span className="c-navbar__notification-mark" />}
            </button>
            <ul className={`c-navbar__notification-content c-navbar__dropdown-content ${isShowListNotification ? 'show' : ''}`}>
              <NavbarNotification setHasNew={setHasNew} setUnreadCount={setUnreadCount} setIsShowListNotification={setIsShowListNotification} />
            </ul>
          </div>
          <div className="c-navbar__dropdown" ref={dropdownRef}>
            <button
              className="c-navbar__dropdown-button"
              onClick={handleDropdownClick}
              style={props.user?.avatar ? {backgroundImage: `url(${props.user.avatar})`} : {}}
            >
              {account}
            </button>
              <ul className={`c-navbar__dropdown-content ${isShowMenu ? 'show' : ''}`}>
                <li>
                  <button
                    className={`c-navbar__dropdown-item c-navbar__account-setting ${location.pathname.startsWith('/user/') ? 'c-navbar__active' : ''}`}
                    onClick={goToAccountSettings}
                  >
                    Account & Settings
                  </button>
                </li>
                <li>
                  <button
                    className="c-navbar__dropdown-item"
                    onClick={() => setIsShowSwitchOrganizationModal(true)}
                  >
                    Switch Organization
                  </button>
                </li>
                <li>
                  <button className="c-navbar__dropdown-item c-navbar__log-out" onClick={() => logout(true)}>
                    Log Out
                  </button>
                </li>
              </ul>
            </div> */}
          </>
        </div>
      </div>
      <Suspense fallback={<AppLoading/>}>
        <Modal
          title="Update Project name"
          cancelText="Cancel"
          submitText="Update"
          cancelButtonProps={{
            type: "dark",
          }}
          open={isShowModelUpdateName}
          onSubmit={onUpdateProjectName}
          onCancel={() => setShowModelUpdateName(false)}
          className="c-navbar__modal-update-name"
        >
          {errorNode}
          {loadingUpdateProjectName && (
            <Spin loading={loadingUpdateProjectName} />
          )}
          <InputBase
            className="c-general__field"
            label="Project name"
            placeholder="Type your project name"
            disabled={loadingUpdateProjectName}
            onChange={(e) => handleFieldChange(e.target.value)}
            value={projectName}
            allowClear={false}
            isRequired
            error={
              Object.hasOwn(validationErrors, "title")
                ? validationErrors["title"][0]
                : null
            }
          />
        </Modal>
      </Suspense>
    </div>
  );
};

export const Navbar = React.memo(MemoizedNavbar);
