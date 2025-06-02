import {TProjectModel} from "@/models/project";
import useMLBackendHook from "@/hooks/settings/ml/useMLBackendHook";
import React, {useMemo} from "react";
import {useBooleanLoader} from "@/providers/LoaderProvider";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import useDebouncedEffect from "@/hooks/useDebouncedEffect";
import { useCentrifuge } from "@/providers/CentrifugoProvider";
// import { getPredictModel } from "@/utils/models";

type TDemoProps = {
  project: TProjectModel;
}

export default function Demo({project}: TDemoProps) {
  const [loadingPreview, setLoadingPreview] = React.useState(true);
  const [previewUrl, setPreviewUrl] = React.useState<string>("about:blank");
  const [error, setError] = React.useState<string | null>(null);
  const projectID = useMemo(() => project?.id ? project?.id : 0, [project?.id]);
  const {list, refresh, loading, initialized, loadingError} = useMLBackendHook(projectID, undefined, true);
  const backend = useMemo(() => list.length > 0 ? list[0] : undefined, [list]);
  const {onMessage} = useCentrifuge();

  useBooleanLoader(loading, "Loading...");

  React.useEffect(() => {
    setError(null)
    if (!backend) {
      return;
    }

    const controller = new AbortController();
    // const modelId = (backend.model_checkpoint !== null && backend.model_checkpoint !== "")
    //   ? backend.model_checkpoint
    //   : getPredictModel(project.label_config_title);

    const requestOptions = {
      method: "GET",
      headers: {"Content-Type": "application/json"},
      // body: JSON.stringify({
      //   project: projectID.toString(),
      //   params: {
      //     task: getPredictTask(project.label_config_title),
      //     model_id: modelId,
      //   },
      // }),
      signal: controller.signal,
    };

    let url = backend.url.trim();
    console.log("aaa", url)

    while (url.endsWith("/")) {
      url = url.substring(0, url.length - 1);
    }
  
    const fetchData = (retryCount = 1) => {
      console.log("Request Options:", requestOptions);
  
      fetch(url , requestOptions)
        // .then(r => r.json())
        .then(r => {
          console.log("Response:", r);
          // if (controller.signal.aborted || !Object.hasOwn(r, "share_url")) {
          //   throw new Error("No share_url in response.");
          // }
  
          // setPreviewUrl(r.share_url);
          setPreviewUrl(url);
        })
        .catch(e => {
          console.error("Fetch error:", e);
  
          // Retry logic
          if (retryCount > 0) {
            console.log(`Retrying... Attempts left: ${retryCount}`);
            fetchData(retryCount - 1); // Recursive retry
          } else {
            if (Object.hasOwn(e, "message")) {
              setError(e.message);
            } else {
              setError("An error has been occurred while loading model information.");
            }
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoadingPreview(false);
          }
        });
    };
  
    fetchData(); // Call the fetch function
  
    // Cleanup on unmount
    return () => {
      controller.abort();
    };
  }, [backend, project.label_config_title, projectID]);

  useDebouncedEffect(() => {
    const unsub = onMessage("project/" + projectID + "/deploy-history", () => {
      refresh().promise.catch(e => {
        window.APP_SETTINGS.debug && console.error(e);
      });
    });

    return () => {
      unsub();
    }
  }, [projectID]);

  if (!initialized || loading || (backend && loadingPreview)) {
    return <EmptyContent message="Loading..." />
  }

  if (loadingError) {
    return <EmptyContent
      message={"Failed to load ML backends. Error: " + loadingError}
      buttons={[
        {children: "Retry", onClick: () => refresh()},
      ]}
    />
  }

  if (error) {
    return <EmptyContent
      message={"Failed to load the demo. Error: " + error}
      buttons={[
        {children: "Retry", onClick: () => refresh()},
      ]}
    />
  }

  if (!backend) {
    return <EmptyContent message={(
      <>
        <div>It looks like you don't have a machine learning backend set up yet.</div>
        <div>To view the demo, you need to add a model and make sure it has a running computer.</div>
      </>
    )} />
  }

  return (
    <iframe
      title="Model Demo"
      allow="camera;microphone"
      src={previewUrl}
      style={{width: "100%", height: "calc(100% - 4px)", border: "none"}}
    />
  );
}
