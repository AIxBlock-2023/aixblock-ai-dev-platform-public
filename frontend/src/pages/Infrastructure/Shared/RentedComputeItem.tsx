import React, {useMemo} from "react";
import "./RentedComputeItem.scss";
import {formatBytesToGB, formatFloat} from "@/utils/customFormat";
import {Tooltip} from "react-tooltip";
import IconTinyEdit from "@/assets/icons/IconTinyInfo";
import {
  getRentedGpuStatusText,
  TComputeInstallStatus,
  TComputeMarketplaceRentedCard
} from "@/hooks/computes/useRentedGpu";
import Button from "@/components/Button/Button";
import {IconCopySolid, IconNotification, IconTrash} from "@/assets/icons/Index";
// import IconPause from "@/assets/icons/IconPause";
import SkeletonBox from "@/components/SkeletonBox/SkeletonBox";
import {openNewTab} from "@/utils/openNewTab";
import IconEdit from "@/assets/icons/IconEdit";
import {useNavigate} from "react-router-dom";
import {useCentrifuge} from "../../../providers/CentrifugoProvider";
import {useAuth} from "../../../providers/AuthProvider";

export type TProps = {
  compute_id: number,
  vendor_id?: number | string | null,
  infrastructure_id?: number | string | null,
  install_logs?: string | null,
  datacenter?: string | null,
  location?: string | null,
  machine_type?: string | null,
  service?: string | null,
  gpu_tflops?: string | null,
  max_cuda_version?: number | null,
  per_gpu_ram?: string | null,
  per_gpu_memory_bandwidth?: number | string | null,
  motherboard?: string | null,
  number_of_pcie_per_gpu?: string | null,
  cpu?: string | null,
  eff_out_of_total_nu_of_cpu_virtual_cores?: string | null,
  eff_out_of_total_system_ram?: string | null,
  internet_down_speed?: number | string | null,
  internet_up_speed?: number | string | null,
  rentingHours?: number | string | null,
  remainingHours?: number | string | null,
  provider_id?: number | null,
  source?: TComputeMarketplaceRentedCard["type"] | null,
  price?: string | number | null,
  ip?: string | null,
  name?: string | null,
  installStatus?: TComputeInstallStatus,
  image?: string;
  type?: string;
  schema?: string | null;
  onDeleteCompute?: (id: number, infrastructure_id?: number | string | null) => void,
  onNotificationClick?: () => void,
  history_id: number;
  new_notification_count?: number;
  onDeleteComputeCrypto?: (historyId: number) => void,
  payment_method?: string | null
}

export default function RentedComputeItem(props: TProps) {
  const navigate = useNavigate();
  const {publish} = useCentrifuge();
  const {user} = useAuth();

  const tooltipPrefix = useMemo(() => {
    return "tooltip-" + (props.compute_id ?? Math.random().toString().substring(2, 8)) + "-";
  }, [props.compute_id]);

  const isInstalling = useMemo(() => {
    return props?.installStatus === "installing";
  }, [props?.installStatus]);


  const isWaitVerify = useMemo(() => {
    return props?.installStatus === "wait_verify";
  }, [props?.installStatus]);

  const isWaitCrypto = useMemo(() => {
    return props?.installStatus === "wait_crypto";
  }, [props?.installStatus]);

  const notificationsCount = useMemo(() => props?.new_notification_count ?? 0, [props?.new_notification_count]);

  const status: {
    color: string,
    text: string,
    actions: React.ReactElement[],
  } | null | undefined = useMemo(() => {
    const deleteButton = (
      <Button
        isBlock={true}
        hoverText="Delete Compute"
        icon={<IconTrash/>}
        onClick={() => {
          if (props.payment_method === "crypto") {
            props.onDeleteComputeCrypto?.(props.history_id);
          } else {
            props.onDeleteCompute?.(props.history_id, props.infrastructure_id);
          }
        }}
      />
    );

    // const pauseButton = (
    //   <>
    //     <Button
    //       isBlock={true}
    //       icon={<IconPause/>}
    //       onClick={() => void 0}
    //     />
    //   </>
    // );

    const notificationButton = (
      <>
        <Button
          className={notificationsCount > 0 ? "btn--red btn--animate" : ""}
          isBlock={true}
          hoverText="Notification"
          icon={<IconNotification/>}
          onClick={() => props.onNotificationClick?.()}
        />
      </>
    );

    const editVerifyButton = (
      <>
        <Button
          isBlock={true}
          hoverText="Edit & Download"
          icon={<IconEdit/>}
          onClick={() => {
            navigate('/computes/add-host');
          }}
        />
      </>
    );

    const copyVerifyCommandButton = (
      <>
        {props.infrastructure_id && (
          <Button
            isBlock={true}
            hoverText="Copy command verify"
            icon={<IconCopySolid/>}
            onClick={() => {
              const fileName = `aixblock_computes_verification-linux__${props.infrastructure_id}`;
              const textToCopy = `wget -O ${fileName} ${window.location.origin}/static/computes/aixblock_computes_verification-linux`
                + ` && sudo chmod +x ${fileName}`
                + ` && sudo ./${fileName}`
              const msgNotification = {
                type: "Success",
                message: "Copied successfully, please paste and run on your linux server"
              };

              navigator.clipboard.writeText(textToCopy)
                .then(() => {
                  publish("user-notification/" + user?.uuid, msgNotification, false);
                })
                .catch((err) => {
                  console.error('Failed to copy text: ', err);
                });
            }}
          />
        )}
      </>
    );

    if (props?.installStatus === "installing") {
      return {
        color: "blue",
        text: "Installing",
        actions: [
          // deleteButton,
          // pauseButton,
          notificationButton,
          // deleteCryptoButton
        ],
      };
    } else if (props?.installStatus === "wait_verify") {
      return {
        color: "black",
        text: "Wait Verify",
        actions: [
          deleteButton,
          notificationButton,
          editVerifyButton,
          copyVerifyCommandButton,
          // deleteCryptoButton
        ],
      };
    } else if (props?.installStatus === "failed") {
      return {
        color: "red",
        text: "Failed",
        actions: [
          deleteButton,
          notificationButton,
        ],
      };
    } else if (props?.installStatus === "completed") {
      return {
        color: "blue",
        text: "Running",
        actions: [
          deleteButton,
          // pauseButton,
          notificationButton,
        ],
      };
    } else if (props?.installStatus === "wait_crypto") {
      return {
        color: "black",
        text: "Wait Verify",
        actions: [
          // deleteButton,
          notificationButton,
          // editVerifyButton,
          // copyVerifyCommandButton
        ],
      };
    }
  }, [navigate, props, publish, user?.uuid, notificationsCount]);

  return (
    <div className="p-infrastructure-compute-item">
      <div className="p-infrastructure-compute-item__inner">
        <div className="badges" style={isInstalling || isWaitVerify || isWaitCrypto ? {flexWrap: "nowrap"} : {}}>
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <span className="badge" id={tooltipPrefix + "compute-id"}>
            {props.compute_id ?? "??????"}&nbsp;
            <IconTinyEdit style={{transform: "translateY(1px)"}}/>
          </span>}
          <Tooltip place="top" positionStrategy="fixed" content="Compute ID"
                   anchorSelect={"#" + tooltipPrefix + "compute-id"}/>
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <span className="badge" id={tooltipPrefix + "provider-id"}>
            {props.provider_id ?? "??????"}&nbsp;
            <IconTinyEdit style={{transform: "translateY(1px)"}}/>
          </span>}
          <Tooltip place="top" positionStrategy="fixed" content="Provider ID"
                   anchorSelect={"#" + tooltipPrefix + "provider-id"}/>
          {props?.datacenter ?
            (<>
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <span className="badge badge--green"
                                                                     id={tooltipPrefix + "datacenter"}>{props.datacenter ?? "Not Specific"}</span>}
              <Tooltip place="top" positionStrategy="fixed" content="Datacenter"
                       anchorSelect={"#" + tooltipPrefix + "datacenter"}/>
            </>) : (null)
          }
          {isInstalling || isWaitVerify || isWaitCrypto ? (
            <SkeletonBox/>
          ) : (
            props.location && (
              <>
                <span className="badge" id={tooltipPrefix + "location"}>
                  {props.location}
                </span>
                <Tooltip
                  place="top"
                  positionStrategy="fixed"
                  content="Location"
                  anchorSelect={"#" + tooltipPrefix + "location"}
                />
              </>
            )
          )}
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> :
            <span className="badge badge--purple" id={tooltipPrefix + "machine-type"}>
            {props.machine_type ?? "??????"}
          </span>}
          <Tooltip place="top" positionStrategy="fixed" content={"Machine type"}
                   anchorSelect={"#" + tooltipPrefix + "machine-type"}/>
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <span
            onClick={() => openNewTab(`${props.schema ? props.schema : "https"}://${props.ip}`)}
            className="badge clickable" id={tooltipPrefix + "ip"}>
            {props.ip ?? "?"}
          </span>}
          <Tooltip place="top" positionStrategy="fixed" content="IP"
                   anchorSelect={"#" + tooltipPrefix + "ip"}/>
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> :
            <span className="badge badge--black">Service: {props.service ?? "?"}</span>}
          {props?.type !== "COMPUTE-SELF-HOST" &&
            <>
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> :
                <span className="badge badge--semi-blue">{getRentedGpuStatusText(props.source)}</span>}
            </>
          }
          {props.price &&
            <>
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> :
                <span className="badge badge--price" id={tooltipPrefix + "price"}>{props.price ?? "?"}</span>}
            </>
          }
          {props.price &&
            <Tooltip place="top" positionStrategy="fixed" content={"Price"}
                     anchorSelect={"#" + tooltipPrefix + "price"}/>
          }
        </div>
        <div className="columns">
          <div className="column column--gpu">
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <div className="name">{props.name ?? "?"}</div>}
            <div className="split">
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginRight: "5px"}}/> : <div className="left">
                <div className="tflops" id={tooltipPrefix + "tflops"}>
                  <strong>{props.gpu_tflops ? formatFloat(parseFloat(props.gpu_tflops)) : "?"}</strong> <span
                  className="unit">TFLOPS</span>
                </div>
                <Tooltip place="left" positionStrategy="fixed" content="Total GPU TeraFLOPs"
                         anchorSelect={"#" + tooltipPrefix + "tflops"}/>
                <div className="cuda" id={tooltipPrefix + "cuda"}>
                  Max CUDA: {props.max_cuda_version ?? "?"}
                </div>
                <Tooltip place="left" positionStrategy="fixed" content="Maximum CUDA Version Supported"
                         anchorSelect={"#" + tooltipPrefix + "cuda"}/>
              </div>}
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginLeft: "5px"}}/> : <div className="right">
                <div className="gpu-ram" id={tooltipPrefix + "gpu-ram"}>{formatBytesToGB(props.per_gpu_ram) ?? "?"} GB
                </div>
                <Tooltip place="top" positionStrategy="fixed" content="Per GPU RAM"
                         anchorSelect={"#" + tooltipPrefix + "gpu-ram"}/>
                <div className="gpu-bw" id={tooltipPrefix + "gpu-bw"}>
                  {(typeof props.per_gpu_memory_bandwidth === 'number' ||
                    (typeof props.per_gpu_memory_bandwidth === 'string' && !isNaN(Number(props.per_gpu_memory_bandwidth)))) &&
                  Number(props.per_gpu_memory_bandwidth) > 1000000000  // 1GB in bytes
                    ? `${formatBytesToGB(Number(props.per_gpu_memory_bandwidth))} GB/s`
                    : props.per_gpu_memory_bandwidth !== null && props.per_gpu_memory_bandwidth !== undefined
                      ? `${props.per_gpu_memory_bandwidth} GB/s`
                      : "?"}
                </div>
                <Tooltip place="bottom" positionStrategy="fixed" content="Per GPU Memory Bandwidth"
                         anchorSelect={"#" + tooltipPrefix + "gpu-bw"}/>
              </div>}
            </div>
          </div>
          <div className="column column--cpu">
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginBottom: "10px"}}/> :
              <div className="motherboard" id={tooltipPrefix + "motherboard"}>{props.motherboard ?? "?"}</div>}
            <Tooltip place="top-start" positionStrategy="fixed" content="Motherboard"
                     anchorSelect={"#" + tooltipPrefix + "motherboard"}/>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginBottom: "10px"}}/> :
              <div className="pcie">{props.number_of_pcie_per_gpu ?? "?"}</div>}
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginBottom: "10px"}}/> :
              <div className="cpu" id={tooltipPrefix + "cpu"}>{props.cpu ?? "?"}</div>}
            <Tooltip place="bottom-start" positionStrategy="fixed" content="CPU"
                     anchorSelect={"#" + tooltipPrefix + "cpu"}/>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <div className="cpu-ram">
              <span>{props.eff_out_of_total_nu_of_cpu_virtual_cores ?? "?"} CPU</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span>{props.eff_out_of_total_system_ram ?? "?"} GB</span>
            </div>}
          </div>
          <div className="column column--network">
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginBottom: "10px"}}/> :
              <div className="upload" id={tooltipPrefix + "upload"}>
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.28704 6.37988L8.3337 2.33322L12.3804 6.37988" stroke="#40405B" strokeWidth="1.5"
                        strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.3335 13.667V2.44699" stroke="#40405B" strokeWidth="1.5" strokeMiterlimit="10"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <strong>{props.internet_up_speed ?? "?"} Mbps</strong>
              </div>}
            <Tooltip place="top-start" positionStrategy="fixed" content="Internet Upload Speed (Shared)"
                     anchorSelect={"#" + tooltipPrefix + "upload"}/>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginBottom: "10px"}}/> :
              <div className="download" id={tooltipPrefix + "download"}>
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.38 9.62012L8.33329 13.6668L4.28662 9.62012" stroke="#40405B" strokeWidth="1.5"
                        strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.3335 2.33301V13.553" stroke="#40405B" strokeWidth="1.5" strokeMiterlimit="10"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <strong>{props.internet_down_speed ?? "?"} Mbps</strong>
              </div>}
            <Tooltip place="bottom-start" positionStrategy="fixed" content="Internet Download Speed (Shared)"
                     anchorSelect={"#" + tooltipPrefix + "download"}/>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{marginBottom: "10px"}}/> : <div className="duration">
              Age: <strong>{props.rentingHours ?? "?"} hour(s)</strong>
            </div>}
            {props?.type !== "COMPUTE-SELF-HOST" &&
              <>
                {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <div className="reliability">
                  Remaining: <strong>{props.remainingHours ?? "?"} hour(s)</strong>
                </div>}
              </>
            }
            {props.image &&
              <>
                {
                  isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox/> : <div className="image">
                    Image: <strong>{props.image ?? "?"}</strong>
                  </div>
                }
              </>
            }
          </div>
          {status &&

            <div className="column column--status">
              {/* <div className="column column--logs">
                {props.install_logs}
              </div> */}
              <React.Fragment>
                {status.actions.length > 0 && (
                  <div className="actions">
                    {status.actions}
                  </div>
                )}
                <div className={"text text--" + status.color}>{status.text}</div>
              </React.Fragment>

            </div>
          }
        </div>
      </div>
    </div>
  );
}
