import React, { CSSProperties, MouseEventHandler, ReactNode } from "react";
import "./Button.scss";

export type TButtonProps = {
  className?: string;
  htmlType?: "button" | "submit" | "reset";
  type?: "primary" | "secondary" | "dark" | "hot" | "gradient" | "white" | "warning";
  children?: ReactNode;
  size?: "tiny" | "small" | "medium" | "large";
  iconPosition?: "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: CSSProperties;
  onClick?: MouseEventHandler;
  isBlock?: boolean,
  hoverText?: string;
  id?: string;
};

const Button: React.FC<TButtonProps> = ({
  className,
  htmlType = "button",
  type = "primary",
  children,
  size = "small",
  iconPosition = "right",
  disabled,
  loading,
  icon,
  style,
  onClick,
  isBlock,
  hoverText,
  ...props
}) => {
  let customClass = "btn";
  const classes = `${className ? className : ""} ${customClass} ${customClass}-${size ?? "medium"} ${customClass}-${type ?? "primary"} ${disabled ? "disabled" : ""}`;

  const buttonStyle: React.CSSProperties = {
    ...isBlock ? {display: "flex", width: "100%"} : {},
    ...style,
  };

  return (
    hoverText ? (
      <div className="btn-wrapper">
        <button
          type={htmlType}
          className={classes}
          style={buttonStyle}
          {...props}
          onClick={onClick}
          disabled={disabled}
        >
          {iconPosition === "left" && icon}
          {children}
          {iconPosition === "right" && icon}
        </button>
        <span className="btn-hover-text">
          {hoverText}
        </span>
      </div>
    ) : (
      <button
        type={htmlType}
        className={classes}
        style={buttonStyle}
        {...props}
        onClick={onClick}
        disabled={disabled}
      >
        {iconPosition === "left" && icon}
        {children}
        {iconPosition === "right" && icon}
      </button>
    )
  );
};

export default Button;
