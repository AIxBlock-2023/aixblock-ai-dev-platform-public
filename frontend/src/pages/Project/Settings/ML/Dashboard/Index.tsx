import {TMLBackend} from "@/models/mlBackend";
import React, {useEffect, useRef, useState} from "react";
import "./Index.scss";
import {useApi} from "@/providers/ApiProvider";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";
import {useCentrifuge} from "@/providers/CentrifugoProvider";

export default function Dashboard({backend, onClose}: {
  backend: TMLBackend,
  onClose: () => void,
}) {
  const api = useApi();
  // const [tensorboardUrl, setTensorboardUrl] = React.useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [workspaceUrl, setWorkspaceUrl] = React.useState<string | null>(null
    // "http://103.160.78.156:3000/d/edofrn4oh4wsga/docker-host?orgId=1&refresh=10s&from=1718346892406&to=1718347792406"
  );
  const [systemUrl, setSystemUrl] = React.useState<string | null>(null);
  const [logsUrl, setLogsUrl] = React.useState<string | null>(null);
  const [loadingTensorboard, setLoadingTensorboard] = React.useState<boolean>(false);
  const [loadingError, setLoadingError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState</*"tensorboard" |*/ "dashboard" | "system" | "logs" | null>(null);
  const {onMessage} = useCentrifuge();
  const [logs, setLogs] = useState("");
  const [logsAutoScrollToEnd] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useDebouncedEffect(() => {
    setLoadingTensorboard(true);
    setLoadingError(null);

    const ar = api.call("mlTensorboard", {
      credentials: 'include',
      params: {project_id: backend.project.toString()},
      query: new URLSearchParams({
        backend_id: backend.id.toString(),
      })
    });

    ar.promise
      .then(async r => {
        if (!r.ok) {
          setLoadingError("Error: " + r.status + " / " + r.statusText);
          return;
        }

        const data = await r.json();
        // setTensorboardUrl("https://" + data.tensorboard_url);
        setWorkspaceUrl("https://" + data.tensorboard_url);
        setSystemUrl(data.dashboard_url.startsWith("http") ? data.dashboard_url : "https://" + data.dashboard_url);
        setLogsUrl("https://" + data.dashboard_url);
        setLoadingTensorboard(false);
      })
      .catch(e => {
        if (ar.controller.signal.aborted) {
          return;
        }

        if (e instanceof Error) {
          setLoadingError(e.message);
        } else if (typeof e === "object" && Object.hasOwn(e, "detail")) {
          setLoadingError(e["detail"]);
        } else {
          setLoadingError(e);
        }
      });

    return () => {
      ar.controller.abort("Component unmounted");
    }
  }, [api, backend.id, backend.project]);

  useDebouncedEffect(() => {
    if (activeTab) {
      return;
    }

    /*if (tensorboardUrl) {
      setActiveTab("tensorboard");
    } else*/ if (workspaceUrl) {
      setActiveTab("dashboard");
    } else if (systemUrl) {
      setActiveTab("system");
    } else if (logsUrl) {
      setActiveTab("logs");
    }
  }, [/*tensorboardUrl,*/ workspaceUrl, systemUrl, logsUrl]);

  useDebouncedEffect(() => {
    const unsub = onMessage("ml_logs_" + backend.id, msg => {
      if (typeof msg === "object" && "log" in msg) {
        setLogs(v => v + msg["log"] + "\n");
      }
    }, true);

    return () => {
      unsub();
    }
  }, [onMessage, backend.id]);

  useEffect(() => {
    if (!logsAutoScrollToEnd) {
      return;
    }

    logsContainerRef.current?.scrollTo({top: logsContainerRef.current.scrollHeight})
  }, [logs, logsAutoScrollToEnd]);

  useEffect(() => {
    setLogs("Connected and waiting for incoming logs");
  }, [backend.id]);

  if (loadingTensorboard) {
    return (
      <EmptyContent
        message={loadingError ?? "Loading TensorboardX dashboard..."}
        buttons={[
          {
            children: "Back",
            onClick: onClose,
          }
        ]}
      />
    );
  }

  return (
    <div className="c-ml-dashboard">
      <div className="c-ml-dashboard__tabs">
        {/*{tensorboardUrl && (
          <div className={"c-ml-dashboard__tab " + (activeTab === "tensorboard" ? "active" : "")} onClick={() => setActiveTab("tensorboard")}>
            TensorboardX
          </div>
        )}*/}
        {workspaceUrl && (
          <div className={"c-ml-dashboard__tab " + (activeTab === "dashboard" ? "active" : "")} onClick={() => setActiveTab("dashboard")}>
            Workspace
          </div>
        )}
        {systemUrl && (
          <div className={"c-ml-dashboard__tab " + (activeTab === "system" ? "active" : "")} onClick={() => setActiveTab("system")}>
            Dashboard
          </div>
        )}
        {/* {logsUrl && (
          <div className={"c-ml-dashboard__tab " + (activeTab === "logs" ? "active" : "")} onClick={() => setActiveTab("logs")}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              Logs
              <Switch label="Auto scroll" checked={logsAutoScrollToEnd} onChange={v => setLogsAutoScrollToEnd(v)} />
            </div>
          </div>
        )} */}
        <div className="c-ml-dashboard__tab" onClick={onClose}>
          Close
        </div>
      </div>
      {/*{tensorboardUrl && activeTab === "tensorboard" && (
        <iframe
          title="TensorboardX"
          allow="camera;microphone"
          src={tensorboardUrl}
          style={{
            border: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            flex: 1,
          }}
        />
      )}*/}
      {workspaceUrl && activeTab === "dashboard" && (
        <iframe
          title="Dashboard"
          allow="camera;microphone"
          src={workspaceUrl}
          style={{
            border: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            flex: 1,
          }}
        />
      )}
      {systemUrl && activeTab === "system" && (
        <iframe
          title="System"
          allow="camera;microphone"
          src={systemUrl}
          style={{
            border: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            flex: 1,
          }}
        />
      )}
      {logsUrl && activeTab === "logs" && (
        <div ref={logsContainerRef} style={{
          border: 0,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          flex: 1,
          overflowY: "auto",
          backgroundColor: "white",
        }}>
          <pre style={{
            margin: 0,
            padding: 8,
            whiteSpace: "pre-wrap",
          }}>
            {logs}
          </pre>
        </div>
      )}
    </div>
  );
}
