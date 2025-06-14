import React from "react";
import styles from "./ErrorMessage.module.scss";
import { sanitizeHTML, validateScriptContent } from "../../utils/security";

export const ErrorMessage = ({ error }) => {
  console.error(error);
  if (typeof error === "string") {
    // Security Fix: Validate and sanitize error messages to prevent XSS
    if (!validateScriptContent(error)) {
      console.warn("Security: Potentially dangerous error message blocked", error);
      return <div className={styles.error}>An error occurred. Details have been logged.</div>;
    }
    
    const sanitizedError = sanitizeHTML(error);

    return <div className={styles.error} dangerouslySetInnerHTML={{ __html: sanitizedError }} />;
  }
  const body = error instanceof Error ? error.message : error;

  return <div className={styles.error}>{body}</div>;
};
