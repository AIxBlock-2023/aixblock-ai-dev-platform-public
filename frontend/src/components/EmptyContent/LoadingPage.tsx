import React from "react";
import EmptyContent from "./EmptyContent";
import { createPortal } from "react-dom";

export type TProps = {
    message?: string | React.ReactNode,
}

export default function LoadingPage({ message }: TProps = {
    message: "No data found",
}) {
    return (
        createPortal(<div style={{
            position: "fixed",
            height: "100%",
            width: "100%",
            top: 0,
            left: 0,
            display: "flex",
            alignItems: "center",
            zIndex: 1002
        }}>
            <div className="mask" style={{
                height: "100%",
                width: "100%",
                position: "absolute",
                backgroundColor: "white",
                opacity: 0.4, 
            }}></div>
            <EmptyContent message={message} />
        </div>, document.body)
    );
}
