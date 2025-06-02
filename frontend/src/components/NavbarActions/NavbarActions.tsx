import React from "react";
import { TNavbarBreadcrumb } from "../Navbar/Navbar";
import './NavbarActions.scss';
import Button from "../Button/Button";

type TActionsProps = {
  data: TNavbarBreadcrumb[] | null | undefined;
};

const MemoizedNavbarActions: React.FC<TActionsProps> = (props) => {
  const { data } = props;

  if (!data) {
    return null;
  }

  return (
    <>
      {data.map((b, i) =>
        b.onClick ? (
          <li
            className="c-navbar__actions-item"
            key={"action-" + i}
          >
            <Button 
              className={`c-navbar__icon ${b.class} ${b.actionType ? b.actionType : "default"}`}
              onClick={b.onClick}
              type="secondary"
              icon={b.icon}
            >
              {b.label}
            </Button>
          </li>
        ) : (
          <span
            className="c-navbar__actions-item last"
            key={"action-" + i}
          >
            {b.label}
          </span>
        )
      )}
    </>
  );
};

const NavbarActions = React.memo(MemoizedNavbarActions);

export default NavbarActions;
