import React, { useMemo } from "react";
import { Tooltip } from "react-tooltip";
import IconTinyEdit from "@/assets/icons/IconTinyInfo";
import SkeletonBox from "@/components/SkeletonBox/SkeletonBox";
import { TComputeInstallStatus, TComputeMarketplaceRentedCard } from "@/hooks/computes/useRentedGpu";
import { formatBytesToGB, formatFloat } from "@/utils/customFormat";
import styles from "./ComputeItem.module.scss";
import { openNewTab } from "@/utils/openNewTab";

const DeleteIcon = () => (
  <svg width={35} height={34} viewBox="0 0 41 40" xmlns="http://www.w3.org/2000/svg" fill="none">
    <g filter="url(#a)">
      <rect width={40} height={40} x={1} fill="#fff" rx={8}/>
      <rect width={39} height={39} x={1.5} y={0.5} stroke="#DEDEEC" rx={7.5}/>
      <path stroke="#14142A" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M27.75 15.485a76.276 76.276 0 0 0-7.515-.375c-1.485 0-2.97.075-4.455.225l-1.53.15M18.375 14.727l.165-.982c.12-.712.21-1.245 1.477-1.245h1.966c1.267 0 1.364.563 1.477 1.252l.165.975M26.137 17.855l-.487 7.552c-.082 1.178-.15 2.093-2.242 2.093h-4.816c-2.092 0-2.16-.915-2.242-2.093l-.488-7.552M19.748 23.375h2.497M19.125 20.375h3.75"/>
    </g>
    <defs>
      <filter id="a" width={42} height={42} x={0} y={0} colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
        <feFlood floodOpacity={0} result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
        <feMorphology in="SourceAlpha" radius={1} result="effect1_dropShadow_412_45326"/>
        <feOffset dy={1}/>
        <feGaussianBlur stdDeviation={1}/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix values="0 0 0 0 0.0666667 0 0 0 0 0.0470588 0 0 0 0 0.133333 0 0 0 0.08 0"/>
        <feBlend in2="BackgroundImageFix" result="effect1_dropShadow_412_45326"/>
        <feBlend in="SourceGraphic" in2="effect1_dropShadow_412_45326" result="shape"/>
      </filter>
    </defs>
  </svg>
)

export type TProps = {
  compute_id: number,
  vendor_id?: number | string | null,
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
  onDeleteCompute?: (id: number, project_id?: number | null) => void,
  history_id: number
  model_name?: string | null;
  payer_email?: string;
  payer_full_name?: string;
  deleted_at?: string | null;
}

export default function RentedComputeItem(props: TProps) {
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


  const status: {
    color: string,
    text: string,
  } | null | undefined = useMemo(() => {

    if (props?.deleted_at) {
      return {
        color: styles.cpItemColumnStatusTextRed,
        text: "Deleted",
      };
    } else if (props?.installStatus === "installing") {
      return {
        color: styles.cpItemColumnStatusTextBlue,
        text: "Installing",
      };
    } else if (props?.installStatus === "wait_verify") {
      return {
        color: styles.cpItemColumnStatusTextBlack,
        text: "Wait Verify",
      };
    } else if (props?.installStatus === "failed") {
      return {
        color: styles.cpItemColumnStatusTextRed,
        text: "Failed",
      };
    } else if (props?.installStatus === "completed") {
      return {
        color: styles.cpItemColumnStatusTextBlue,
        text: "Running",
      };
    } else if (props?.installStatus === "wait_crypto") {
      return {
        color: styles.cpItemColumnStatusTextBlack,
        text: "Wait Verify",
      };
    }
  }, [props?.installStatus, props?.deleted_at]);

  return (
    <div className={styles.cpItem}>
      <div className={styles.cpItemInner}>
        <div className={styles.cpItemBadges}>
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadge} id={tooltipPrefix + "compute-id"}>
            {props.compute_id ?? "??????"}&nbsp;
            <IconTinyEdit style={{ transform: "translateY(1px)" }} />
          </span>}
          <Tooltip place="top" positionStrategy="fixed" content="Compute ID"
            anchorSelect={"#" + tooltipPrefix + "compute-id"} />
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadge} id={tooltipPrefix + "provider-id"}>
            {props.provider_id ?? "??????"}&nbsp;
            <IconTinyEdit style={{ transform: "translateY(1px)" }} />
          </span>}
          <Tooltip place="top" positionStrategy="fixed" content="Provider ID"
            anchorSelect={"#" + tooltipPrefix + "provider-id"} />
          {props?.datacenter ?
            (<>
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadgeGreen}
                id={tooltipPrefix + "datacenter"}>{props.datacenter ?? "Not Specific"}</span>}
              <Tooltip place="top" positionStrategy="fixed" content="Datacenter"
                anchorSelect={"#" + tooltipPrefix + "datacenter"} />
            </>) : null
          }
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadge} id={tooltipPrefix + "location"}>{props.location ?? "Unknown"}</span>}
          <Tooltip place="top" positionStrategy="fixed" content="Location"
            anchorSelect={"#" + tooltipPrefix + "location"} />
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadgePurple} id={tooltipPrefix + "machine-type"}>
            {props.machine_type ?? "??????"}
          </span>}
          {props.ip &&
            <>
               {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> :
               <span
                className={styles.cpItemBadgeBlack + ' ' + styles.cpItemBadgeIP}
                id={tooltipPrefix + "ip"}
                onClick={() => openNewTab(`https://${props.ip}`)}
              >
                {props.ip ?? "?"}
              </span>}
              <Tooltip place="top" positionStrategy="fixed" content="IP"
                anchorSelect={"#" + tooltipPrefix + "ip"} />
            </>
          }
          {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadgeBlack}>Service: <span className={styles.cpItemBadgeService}>{props.service ?? "?"}</span></span>}
          {props.price &&
            <>
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <span className={styles.cpItemBadge} id={tooltipPrefix + "price"}>{props.price ?? "?"}</span>}
            </>
          }
          {props.price &&
            <Tooltip place="top" positionStrategy="fixed" content={"Price"}
              anchorSelect={"#" + tooltipPrefix + "price"} />
          }
          {props.onDeleteCompute && (
            <>
              <span
                className={styles.btnDelete}
                onClick={() => props.onDeleteCompute?.(props.compute_id)}
                id={tooltipPrefix + "delete"}
              >
                <DeleteIcon />
              </span>
              <Tooltip place="top" positionStrategy="fixed" content="Delete" anchorSelect={"#" + tooltipPrefix + "delete"} />
            </>
          )}
        </div>
        <div className={styles.cpItemColumns}>
          <div className={styles.cpItemColumnGpu}>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <div className={styles.cpItemColumnGpuName}>{props.name ?? "?"}</div>}
            <div className={styles.cpItemColumnGpuSplit}>
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginRight: "5px" }} /> : <div className="left">
                <div className={styles.cpItemColumnGpuFlops} id={tooltipPrefix + "tflops"}>
                  <strong>{props.gpu_tflops ? formatFloat(parseFloat(props.gpu_tflops)) : "?"}</strong> <span className="unit">TFLOPS</span>
                </div>
                <Tooltip place="left" positionStrategy="fixed" content="Total GPU TeraFLOPs"
                  anchorSelect={"#" + tooltipPrefix + "tflops"} />
                <div className={styles.cpItemColumnGpuCuda} id={tooltipPrefix + "cuda"}>
                  Max CUDA: {props.max_cuda_version ?? "?"}
                </div>
                <Tooltip place="left" positionStrategy="fixed" content="Maximum CUDA Version Supported"
                  anchorSelect={"#" + tooltipPrefix + "cuda"} />
              </div>}
              {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginLeft: "5px" }} /> : <div className="right">
                <div className={styles.cpItemColumnGpuRam} id={tooltipPrefix + "gpu-ram"}>{formatBytesToGB(props.per_gpu_ram) ?? "?"} GB</div>
                <Tooltip place="top" positionStrategy="fixed" content="Per GPU RAM"
                  anchorSelect={"#" + tooltipPrefix + "gpu-ram"} />
                <div className={styles.cpItemColumnGpuBw} id={tooltipPrefix + "gpu-bw"}>{formatBytesToGB(props.per_gpu_memory_bandwidth) ?? "?"} GB/s</div>
                <Tooltip place="bottom" positionStrategy="fixed" content="Per GPU Memory Bandwidth"
                  anchorSelect={"#" + tooltipPrefix + "gpu-bw"} />
              </div>}
            </div>

            {status &&
              <div className={styles.cpItemColumnStatus}>
                  <div className={styles.cpItemColumnStatusText + ' ' + status.color}>{status.text}</div>
              </div>
            }
          </div>

          <div className={styles.cpItemColumnCpu}>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginBottom: "10px" }} /> : <div className={styles.cpItemColumnCpuMotherboard} id={tooltipPrefix + "motherboard"}>{props.motherboard ?? "?"}</div>}
            <Tooltip place="top-start" positionStrategy="fixed" content="Motherboard"
              anchorSelect={"#" + tooltipPrefix + "motherboard"} />
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginBottom: "10px" }} /> : <div className={styles.cpItemColumnCpuPcie}>{props.number_of_pcie_per_gpu ?? "?"}</div>}
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginBottom: "10px" }} /> : <div className={styles.cpItemColumnCpuCpu} id={tooltipPrefix + "cpu"}>{props.cpu ?? "?"}</div>}
            <Tooltip place="bottom-start" positionStrategy="fixed" content="CPU"
              anchorSelect={"#" + tooltipPrefix + "cpu"} />
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <div className={styles.cpItemColumnCpuCpuRam}>
              <span>{props.eff_out_of_total_nu_of_cpu_virtual_cores ?? "?"} CPU</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span>{props.eff_out_of_total_system_ram ?? "?"} GB</span>
            </div>}
            {props.payer_email &&
              <>
                {
                  isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <div className={styles.cpItemColumnNetworkPayerEmail}>
                    Payer email: <strong>{props.payer_email}</strong>
                  </div>
                }
              </>
            }
          </div>
          <div className={styles.cpItemColumnNetwork}>
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginBottom: "10px" }} /> : <div className={styles.cpItemColumnNetworkUpload} id={tooltipPrefix + "upload"}>
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.28704 6.37988L8.3337 2.33322L12.3804 6.37988" stroke="#40405B" strokeWidth="1.5"
                  strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.3335 13.667V2.44699" stroke="#40405B" strokeWidth="1.5" strokeMiterlimit="10"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <strong>{props.internet_up_speed ?? "?"} Mbps</strong>
            </div>}
            <Tooltip place="top-start" positionStrategy="fixed" content="Internet Upload Speed (Shared)"
              anchorSelect={"#" + tooltipPrefix + "upload"} />
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginBottom: "10px" }} /> : <div className={styles.cpItemColumnNetworkDownload} id={tooltipPrefix + "download"}>
              <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.38 9.62012L8.33329 13.6668L4.28662 9.62012" stroke="#40405B" strokeWidth="1.5"
                  strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.3335 2.33301V13.553" stroke="#40405B" strokeWidth="1.5" strokeMiterlimit="10"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <strong>{props.internet_down_speed ?? "?"} Mbps</strong>
            </div>}
            <Tooltip place="bottom-start" positionStrategy="fixed" content="Internet Download Speed (Shared)"
              anchorSelect={"#" + tooltipPrefix + "download"} />
            {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox style={{ marginBottom: "10px" }} /> : <div className={styles.cpItemColumnNetworkDuration}>
              Age: <strong>{props.rentingHours ?? "?"} hour(s)</strong>
            </div>}
            {props?.type !== "COMPUTE-SELF-HOST" &&
              <>
                {isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <div className={styles.cpItemColumnNetworkReliability}>
                  Remaining: <strong>{props.remainingHours ?? "?"} hour(s)</strong>
                </div>}
              </>
            }
            {props.image &&
              <>
                {
                  isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <div className={styles.cpItemColumnNetworkImage}>
                    Image: <strong>{props.image ?? "?"}</strong>
                  </div>
                }
              </>
            }
            {props.payer_full_name &&
              <>
                {
                  isInstalling || isWaitVerify || isWaitCrypto ? <SkeletonBox /> : <div className={styles.cpItemColumnNetworkPayerName}>
                    Payer name: <strong>{props.payer_full_name}</strong>
                  </div>
                }
              </>
            }
          </div>
        </div>
        {props.model_name && (
          <div className={styles.modelName}>
            Model: {props.model_name}
          </div>
        )}
      </div>
    </div>
  );
}

