// @flow

import React, { useState, memo } from "react"
import Paper from "@mui/material/Paper"
import { makeStyles } from "@mui/styles"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import ExpandIcon from "@mui/icons-material/ExpandMore"
import IconButton from "@mui/material/IconButton"
import Collapse from "@mui/material/Collapse"
import { grey } from "@mui/material/colors"
import classnames from "classnames"
import useEventCallback from "use-event-callback"
import SidebarBox from "../SidebarBox"

import MUI_THEME from "../utils/muiTheme";
const theme = MUI_THEME;
const useStyles = makeStyles((theme) => ({
  container: { margin: 8 },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingLeft: 16,
    paddingRight: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    flexGrow: 1,
    paddingLeft: 8,
    color: "#fff",
    "& span": {
      color: "#fff",
      fontSize: 12,
    },
  },
  expandButton: {
    padding: 0,
    width: 30,
    height: 30,
    "& .icon": {
      marginTop: -6,
      width: 20,
      height: 20,
      transition: "500ms transform",
      "&.expanded": {
        transform: "rotate(180deg)",
      },
    },
  },
  expandedContent: {
    maxHeight: 300,
    overflowY: "auto",
    "&.noScroll": {
      overflowY: "visible",
      overflow: "visible",
    },
  },
}))

export const SidebarBoxContainer = ({
  icon,
  title,
  subTitle,
  children,
  noScroll = false,
  expandedByDefault = false,
  expandable,
  actionIcon,
  onActionClick,
  className,
  actionIconClass,
  showIcon = false,
}) => {
  const classes = useStyles()
  const content = (
    <div
      className={classnames(classes.expandedContent, noScroll && "noScroll")}
    >
      {children}
    </div>
  )

  const [expanded, changeExpanded] = useState(expandedByDefault)
  const toggleExpanded = useEventCallback(() => changeExpanded(!expanded))

  return (
    <ThemeProvider theme={theme}>
      <SidebarBox
        {...(showIcon && { icon: icon })}
        title={title}
        subTitle={subTitle}
        noScroll={noScroll}
        expandedByDefault={expanded}
        expandable={expandable}
        actionIcon={actionIcon}
        onActionClick={onActionClick}
        className={className}
        actionIconClass={actionIconClass}
      >
        {children}
      </SidebarBox>
    </ThemeProvider>
  )
}

export default memo(
  SidebarBoxContainer,
  (prev, next) => prev.title === next.title && prev.children === next.children
)
