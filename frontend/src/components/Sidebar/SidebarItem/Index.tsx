import React, {Fragment, memo, useState} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  IconArrowDown,
  IconArrowLeft, IconInfoSmall,
  IconLineSubMenu,
  IconLineSubMenuLast,
} from "@/assets/icons/Index";
import { openNewTab } from "@/utils/openNewTab";
import {SidebarItem, SidebarItemWithID} from "../Sidebar";

interface ISidebarItemProps {
  item: SidebarItemWithID;
  isExpand: boolean;
  setMethod?: (val: boolean) => void;
}

const MemoizedSidebarItem = (props: ISidebarItemProps) => {
  const { item, isExpand, setMethod } = props;
  const [isShowSidebarItems, setShowSidebarItems] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  const onToggleSidebarItem = () => {
    setShowSidebarItems((prev) => !prev);
  };

  const isActive = (path: string, activeChecker?: (path: string) => boolean) => {
    if (activeChecker) {
      return activeChecker(location.pathname);
    }

    return location.pathname.startsWith(path);
  };

  const onChildItemClick = (item: SidebarItem, e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
    if (item.path === "/switch") {
      e.stopPropagation();
      setMethod?.(true);
    } else if (item.path.startsWith("/workflows/")) {
      if (location.pathname.startsWith("/workflows/")) {
        if (item.path.startsWith("/workflows/blocks")) {
          window.pwf.navigate({route: "/settings/pieces"});
        } else {
          window.pwf.navigate({route: item.path.substring(10)});
        }
      } else {
        navigate(item.path);
      }
    } else {
      item.path && navigate(item.path);
    }
  };

  return (
    <>
      <li
        key={item.path}
        className={`c-sidebar__item ${isActive(item.path, item.activeChecker) ? "active" : ""} ${item.children ? "child" : ""}`}
        onClick={() =>
          item?.children
            ? onToggleSidebarItem()
            : item.path === "/notebook/"
              ? openNewTab(window.APP_SETTINGS.hostname + "notebook/")
              : item.path === "/discord/"
                ? openNewTab("https://discord.gg/wHkVHdw8Rn")
                : item.path === "/open-source/"
                  ? openNewTab("https://github.com/AIxBlock-2023/aixblock-ai-dev-platform-public")
                  : item.path === "/open-dataset/"
                    ? openNewTab("https://huggingface.co/AIxBlock")
                    : navigate(item.path)
        }
      >
        <div className={`c-sidebar__item-content ${isShowSidebarItems ? "active" : ""}`}>
          <div className="c-sidebar__item-title">
            {item.icon}
            {isExpand ? item.label : null}
            {item.description && (
              <Fragment>
                <span
                  data-tooltip-id={props.item.id}
                  data-tooltip-place="right-end"
                  data-tooltip-position-strategy="fixed"
                  data-tooltip-content={item.description}
                >
                  <IconInfoSmall />
                </span>
              </Fragment>
            )}
          </div>
          {
            (item?.children?.length ?? 0) > 0 && isExpand
              ? (
                isActive(item.path, item.activeChecker)
                  ? <IconArrowDown/>
                  : <IconArrowLeft/>
              )
              : null
          }
        </div>
      </li>
      {isShowSidebarItems &&
        item?.children?.map((child, index) => (
          <Fragment key={`key-${child.label}`}>
            {isExpand && (
              <li
                key={`key-${child.label}`}
                className={`c-sidebar__item child ${isActive(child.path)}`}
                onClick={(e) => onChildItemClick(child, e)}
              >
                {item.children && item.children?.length - 1 !== index ? (
                  <IconLineSubMenu />
                ) : (
                  <IconLineSubMenuLast />
                )}
                <p>{child.label}</p>
              </li>
            )}
          </Fragment>
        ))}
    </>
  );
};

const ItemSidebar = memo(MemoizedSidebarItem);

export default ItemSidebar;
