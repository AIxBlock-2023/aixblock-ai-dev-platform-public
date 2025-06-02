import dayjs from "dayjs";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import IconCirclePlus from "@/assets/icons/IconCirclePlus";
import IconInfoSmall from "@/assets/icons/IconInfoSmall";
import IconSearch from "@/assets/icons/iconSearch";
import { confirmDialog, infoDialog } from "@/components/Dialog";
import InputBase from "@/components/InputBase/InputBase";
import Pagination from "@/components/Pagination/Pagination";
import Switch from "@/components/Switch/Switch";
import { useRentedGpu } from "@/hooks/computes/useRentedGpu";
import { useUserLayout } from "@/layouts/UserLayout";
import { TApiCallResult, useApi } from "@/providers/ApiProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useBooleanLoader, usePromiseLoader } from "@/providers/LoaderProvider";
import { formatFloat } from "@/utils/customFormat";
import Deposit from "../ComputesMarketplace/Deposit/Deposit";
import PreferenceModal, { TAutoProvision } from "../ComputesSupplier/PreferenceModal";
import "./Index.scss";
import RentedComputeItem from "./RentedComputeItem";
import { TNavbarBreadcrumb } from "@/components/Navbar/Navbar";
import IconPlay from "@/assets/icons/IconPlay";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import EmptySetupComputes from "./EmptyCompute/Index";
import { VIDEO_URL } from "@/constants/projectConstants";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import { useCentrifuge } from "@/providers/CentrifugoProvider";

interface INotification {
  id: number;
  content: string;
  link: string | null;
  is_read: boolean;
  time: string; // Consider using Date if you plan to manipulate date/time values
  detail: string;
  deleted_at: string | null;
  type: string;
  status: 'info' | 'warning' | 'error'; // Adjust the possible values based on your requirements
  history_id: number;
}
const ComputesPage = () => {
  localStorage.setItem("canPushMessage", "true");
  const userLayout = useUserLayout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { call } = useApi();
  const { user } = useAuth();
  const currentPage = searchParams.get("page");
  const [autoProvision, setAutoProvision] = useState<boolean>(false);
  const [isDeposit, setIsDeposit] = useState(false);
  const { addPromise } = usePromiseLoader();
  const [dataAutoProvision, setDataAutoProvision] = useState<TAutoProvision | undefined>()
  const [search, setSearch] = useState<string>("");
  const [loadingError, setLoadingError] = React.useState<null | string>(null);
  const [openPreferenceModalOption, setOpenPreferenceModalOption] = useState<{
    isOpen: boolean;
    title: string;
  }>({
    isOpen: false,
    title: "",
  });    
  const { list: rentedGpus, loading, refresh, page, setPage, error } = useRentedGpu({
    page: currentPage ? Number(currentPage) : 1,
    pageSize: 20,
    search,
  });
  const { subscribe, onMessage, unsubscribe, isSubscribed } = useCentrifuge();

  useEffect(() => {
    if (!rentedGpus?.results) {
      return;
    }

    const installedComputes = rentedGpus.results.filter(c => c.compute_install === "completed" && c.service_type === "model-training");
    const installingComputes = rentedGpus.results.filter(c => c.compute_install === "installing" && c.service_type === "model-training");

    if (installedComputes.length === 0 || installingComputes.length > 0) {
      return;
    }

    const returnInfo = localStorage.getItem("computes-return");

    if (!returnInfo) {
      return;
    }

    try {
      const data = JSON.parse(returnInfo);

      if (typeof data === "object" && "name" in data && "url" in data) {
        confirmDialog({
          title: data["name"],
          message: "It seems you have compute now. Do you want to continue with the project?",
          submitText: "Yes, continue with the project",
          onSubmit: () => navigate(data["url"]),
        });
      }
    } catch {
    } finally {
      localStorage.removeItem("computes-return");
    }
  }, [rentedGpus, navigate]);
 
  const rentedGpusList = useMemo(() => {
    return rentedGpus?.results?.filter((item) => {

      if (item.compute_install === "installing" || item.compute_install === "wait_verify" || item.compute_install === "wait_crypto") {
        const topic = item.compute_marketplace.infrastructure_id;
        const isAlreadySubscribed = isSubscribed(topic, true);
        // Subscribe to the topic if not already subscribed and the status is "installing"
        if (!isAlreadySubscribed) {
          subscribe(topic, true);
        }
      }
      // const timeDiff = formatFloat(dayjs(item.time_end).diff(dayjs(), "hour", true));
      return (item.compute_install === "installing" || item.compute_install === "wait_verify" || item.compute_install === "completed" || item.compute_install === "failed" || item.compute_install === "wait_crypto");
    })
  }, [isSubscribed, rentedGpus?.results, subscribe]);

  useEffect(() => {
    const subscriptions = rentedGpus?.results?.map(item => {
      if (item.compute_install === "installing" || item.compute_install === "wait_verify" || item.compute_install === "wait_crypto") {
       
        // Set up message handler for the topic and get the unsubscribe function
        const unsub = onMessage(item.compute_marketplace.infrastructure_id, (msg: any) => {
          // Handle the incoming message here.
          // If the received message contains the field `refresh` set to true, unsubscribe from the topic.
          /**
           * Example of expected message structure:
           * {
           *    "refresh": true
           * }
           */
          if(msg.refresh){
            // refresh data rentedGpusList
            refresh()
            // unsubscribe topic infrastructure_id if update status installing to failed or compleated
            if (item.compute_install === "installing"){
              unsubscribe(item.compute_marketplace.infrastructure_id, true)
            }
          }
        });
        // Return the unsubscribe function to be called during cleanup
        return unsub;
      }
      return null;
    });

    // Cleanup function to unsubscribe from all topics when the component unmounts
    return () => {
      subscriptions?.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
    };
  }, [rentedGpus?.results, subscribe, onMessage, unsubscribe, refresh]);


  useBooleanLoader(loading, "Loading list rented...");

  const actions: TNavbarBreadcrumb[] = [
    {
      icon: <IconCirclePlus />,
      label: "Add New Compute",
      onClick: () => navigate(`/computes/add`),
      actionType: "danger",
      class: "btn-add-new-compute"
    },
    {
      icon: <IconPlay />,
      label: "Watch demo video",
      onClick: () => {
        infoDialog({
          cancelText: null,
          className: "model-demo-video",
          message: (
            <VideoPlayer url={VIDEO_URL.SETUP_COMPUTE} />
          ),
        });
      },
      actionType: "outline",
      class: "watch-demo-video"
    },
  ]

  React.useEffect(() => {
    userLayout.setBreadcrumbs([
      {
        label: `List Computes  ${rentedGpusList && rentedGpusList?.length > 0 ? `( ${rentedGpusList?.length} )` : ""}`,
      },
    ]);
    userLayout.setActions(rentedGpusList && rentedGpusList?.length > 0 ? actions : []);
    return () => {
      userLayout.clearBreadcrumbs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLayout, rentedGpusList]);

  const onDeleteCompute = useCallback(
    (id: number) => {
      confirmDialog({
        message: "Are you sure you want to delete this compute?",
        onSubmit() {
          try {
            const ar = call("deleteRentedGpu", {
              params: { id: id.toString() },
            });

            ar.promise.then(refresh);
            localStorage.setItem('apiCallFinished', 'true')
          } catch (error) {
            const err =
              error instanceof Error ? error.message : "Something when wrong!";
            infoDialog({ message: err });
          }
        },
      });
    },
    [call, refresh]
  );

  const onNotificationCompute = useCallback(
   
    async (id: number) => {
      let listNotification = [] as INotification[]
      const response: TApiCallResult =  call("userNotification", {
        params: {
          history_id: id.toString(),
        },
      });
      const res = await response.promise;

      if (response.controller.signal.aborted) return;

      if (res.ok) {
        const data = await res.json();
        listNotification = data.results
        console.log('listNotification', listNotification)

      } else {
        throw new Error(`Failed to fetch data. Status: ${res.status}`);
      }


      const generateMessage = () => (
        
        <div className="msg-notification">
          {listNotification.map((notification: INotification) => (
            <>
            <div className="notification-item">
                <p
                  key={notification.id}
                  className={`msg-${notification.status.toLowerCase()}`}
                >
                  {notification.content}
                </p>
                <p>
                  - {dayjs(notification.time).format('MM/DD/YYYY HH:mm:ss')}
                </p>
            </div>
           
            </>
          ))}
        </div>
      );

      infoDialog({
        title: 'Notification',
        message: generateMessage,
      });
    },
    [call]
  );

  const onDeleteAutoProvision = useCallback(
    () => {
      confirmDialog({
        message: "Are you sure to stop Auto Provision!",
        async onSubmit() {
          try {
            if (user?.id) {
              const ar = call("deleteComputePreference", {
                params: { id: user?.id.toString() },
              });
              addPromise(ar.promise, "Stopping Auto Provision...");
              ar.promise.then(r => {
                if (r.ok) {
                  infoDialog({ message: "The Auto Provision feature has been stopped." });
                  setAutoProvision(false);
                } else {
                  infoDialog({ message: "An error occurred while stop Auto Provision. Please try again!" });
                }
              })
            }
          } catch (error) {
            if (error instanceof Error) {
              infoDialog({ message: error.message });
            } else {
              infoDialog({ message: "An error occurred while stop Auto Provision. Please try again!" });
            }
          }
        },
      });
    }, [call, user?.id, addPromise]
  );

  const submitAutoProvision = useCallback(async (data: TAutoProvision) => {
    try {
      if (user?.id) {
        const ar = call("postAutoMergeCard", {
          params: { id: user?.id.toString() },
          body: {
            price_from: data.minPrice,
            price_to: data.maxPrice,
            unit: 'hour',
            model_card: data.modelIds.join(","),
            user_id: user?.id,
            type_remove: data.type_remove,
          }
        });
        addPromise(ar.promise, "Setting up Auto Provision...");
        ar.promise.then(r => {
          if (r.ok) {
            setAutoProvision(true);
            setIsDeposit(false);
            infoDialog({ message: "Congratulations on successfully setting up Auto Provision!" });
          } else {
            confirmDialog({
              message: "An error occurred while setup Auto Provision. Please try again!", onCancel() {
                setAutoProvision(false);
                setIsDeposit(false);
              },
              onSubmit() {

              },
            });
          }
        })
      }
    } catch (error) {
      if (error instanceof Error) {
        infoDialog({ message: error.message });
      } else {
        confirmDialog({
          message: "An error occurred while setup Auto Provision. Please try again!", onCancel() {
            setAutoProvision(false);
            setIsDeposit(false);
          },
          onSubmit() {

          }
        });
      }
    }
  }, [call, user?.id, addPromise]);

  const handleBuy = useCallback(() => {
    if (dataAutoProvision) {
      submitAutoProvision(
        dataAutoProvision
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, submitAutoProvision, dataAutoProvision]);
  const handleCancelPreferenceModal = () => {
    setAutoProvision(false);
    setOpenPreferenceModalOption({
      isOpen: false,
      title: "",
    });
  };

  const getAutoProvision = useCallback(async () => {
    try {
      if (user?.id) {
        const ar = call("getComputePreference", {
          params: { id: user?.id.toString() },
        });

        ar.promise.then(async res => {
          const jsonData = await res.json();
          if (res.ok) {
            jsonData.id && setAutoProvision(true);
          }
        })
          .catch(e => {
            if (ar.controller.signal.aborted) {
              return;
            }

            let msg = "An error occurred while loading auto provision.";

            if (e instanceof Error) {
              msg += " Error: " + e.message + ".";
            }

            setLoadingError(msg + " Please try again!");

            if (window.APP_SETTINGS.debug) {
              console.error(e);
            }
          })
      }
    } catch (error) {
      setAutoProvision(false);
    }
  }, [call, user?.id]);

  const handleSubmitPreferenceModal = (data: TAutoProvision) => {
    setOpenPreferenceModalOption({
      isOpen: false,
      title: "",
    });
    setDataAutoProvision(data);
    setIsDeposit(true);
  };
  const showInfoPreference = (isCustom: boolean) => {
    // confirmDialog({})
    setOpenPreferenceModalOption({
      isOpen: true,
      title: isCustom ? "Custom Preference:" : "Set default Preference:",
    });
  };
  const handleSwitchAutoProvision = useCallback(
    (isChecked: boolean) => {
      if (isChecked === autoProvision) return;
      setAutoProvision(isChecked);
      if (isChecked) {
        confirmDialog({
          title: "Compute Preference:",
          message: `If you set the default, there is no need to reset it and only need to be set once.\n
				If you set the settings, you can customize the parameters each time you turn it on`,
          submitText: "Custom",
          cancelText: "Set default",
          onSubmit: () => {
            showInfoPreference(true);
          },
          onCancel(ref) {
            //define as custom button
            if (ref) {
              showInfoPreference(false);
            } else {
              setAutoProvision(false);
            }
          },
        });
      }
    },
    [autoProvision, setAutoProvision]
  );

  const itemsEndTime = useMemo(() => {
    return rentedGpus?.results?.filter((item) => {
      const timeDiff = formatFloat(dayjs(item.time_end).diff(dayjs(), "hour", true));
      return +timeDiff <= 0;
    })
  }, [rentedGpus?.results]);

  const onRemoveCompute = (id: number) => {
    try {
      const ar = call("deleteRentedGpu", {
        params: { id: id.toString() },
      });
      ar.promise.then(async (res) => {
        if (res.ok) {
          refresh();
        }
        return
      })
        .finally(() => {
          if (ar.controller.signal.aborted) return;
          localStorage.setItem('apiCallFinished', 'true');
        })
    } catch (error) {
      const err =
        error instanceof Error ? error.message : "Something when wrong!";
      console.log(err);
    }
  }

  useEffect(() => {
    if (itemsEndTime && itemsEndTime?.length > 0) {
      itemsEndTime.forEach((item) => onRemoveCompute(item.id));
    }
    // Remove compute when remaining expired
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh, itemsEndTime]);

  useEffect(() => {
    getAutoProvision();
  }, [getAutoProvision]);

  const nodeError = useMemo(() => {
    return <EmptyContent message={loadingError} buttons={[
      {
        children: "Retry",
        type: "hot",
        onClick: () => refresh(),
      }
    ]} />
  }, [loadingError, refresh])
  
  if (error && loadingError) {
    return nodeError;
  }

  return (
    <>
      {rentedGpusList && rentedGpusList?.length > 0 ? (
        <>
          {
            !isDeposit ? (
              <div className="p-computes-supplier-ai">
                <div className="p-computes-supplier-ai__header">
                  <div className="p-computes-supplier-ai__block__left">
                    <div className="p-computes-supplier-ai__block__input">
                      <IconSearch className="p-computes-supplier-ai__block__float-icon" />
                      <InputBase
                        placeholder="Search asset"
                        onKeyUp={e => {
                          if (e.key === "Enter") {
                            setSearch(e.currentTarget.value);
                          }
                        }}
                      />
                    </div>
                    {/* <div className="p-computes-supplier-ai__block with-action">
                      <span className="active-filter" />
                      Active
                    </div>
                    <div className="p-computes-supplier-ai__block with-action">
                      <span className="inactive-filter" />
                      Inactive
                    </div> */}
                  </div>

                  <div className="p-computes-supplier-ai__actions">
                    <div className="auto-provision-switch">
                      <Fragment>
                        <span
                          data-tooltip-id={"auto-provision"}
                          data-tooltip-place="top-start"
                          data-tooltip-position-strategy="fixed"
                          data-tooltip-content="Enable this button for auto-scaling computing resources based on your model’s needs. Set your preferences and deposit a minimum of 50 USD in AxB tokens to activate, with the flexibility to withdraw anytime if unused."
                        >
                          <IconInfoSmall width={15} height={15} />
                        </span>
                      </Fragment>
                      <span>Auto Provision</span>
                      <Switch
                        checked={autoProvision}
                        onChange={(isChecked) => {
                          if (!isChecked) onDeleteAutoProvision()
                          else
                            handleSwitchAutoProvision(isChecked);
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/*<Table
              className="computes-list"
              columns={[
                {
                  label: "ID",
                  align: "CENTER",
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => <span>{dataRow.id}</span>,
                },
                {
                  label: "Compute Info",
                  noWrap: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => {
                    try {
                      const config =
                        typeof dataRow.compute_marketplace.config === "object"
                          ? dataRow.compute_marketplace.config
                          : JSON.parse(dataRow.compute_marketplace.config ?? "{}");
                      return (
                        <div className="computes-list__multiple-row">
                          <div className="compose-row">
                            <span className="computes-list__model">
                              {dataRow.compute_marketplace.is_using_cpu ? "CPU" : "NVIDIA"}
                            </span>
                            <div className="computes-list__multiple-row">
                              <span className="subtitle">{`Os : ${
                                config.os ?? "NA"
                              }`}</span>
                              <span className="subtitle">
                                {`Ram : ${formatRAM(config.ram ?? 0)}`}
                              </span>
                              <span className="subtitle">
                                {`Disk : ${config.diskType} ${formatRAM(config.disk ?? 0)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    } catch (error) {
                      return <span>NA</span>;
                    }
                  },
                },
                {
                  label: "Service",
                  noWrap: true,
                  align: "CENTER",
                  sortable: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => (
                    <span className="computes-list__model">
                      {
                        options.find((type) => type.value === dataRow.compute_marketplace.compute_type)
                          ?.label
                      }
                    </span>
                  ),
                },
                {
                  label: "IP Address",
                  noWrap: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => (
                    <a
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(
                          `https://${dataRow.compute_marketplace.ip_address}:${dataRow.compute_marketplace.port}`,
                          ""
                        );
                      }}
                    >
                      {dataRow.compute_marketplace.ip_address}
                    </a>
                  ),
                },
                {
                  label: "Price Unit",
                  noWrap: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => {
                    const price = dataRow.compute_marketplace.is_using_cpu
                      ? dataRow.compute_marketplace.cpu_price
                      : null;
                    return <span>{`${price ? "$"+price+"/hr" : "NA"}`}</span>;
                  },
                },
                {
                  label: "Rental time start",
                  noWrap: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => (
                    <div className="computes-list__multiple-row">
                      <span>{formatDateTime(dataRow.time_start)}</span>
                      <span className="subtitle">12 days 48 mins</span>
                    </div>
                  ),
                },
                {
                  label: "Type",
                  noWrap: true,
                  sortable: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => (
                    <span className="computes-list__type rent">
                      {getRentedGpuStatusText(dataRow.type)}
                    </span>
                  ),
                },
                {
                  label: "Status",
                  noWrap: true,
                  sortable: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => {
                    const className = (
                      dataRow.compute_marketplace.status === "rented_bought"
                      || dataRow.compute_marketplace.status === "in_marketplace"
                    ) ? "available" : "pause";
      
                    const statusText = (
                      dataRow.compute_marketplace.status === "rented_bought"
                      || dataRow.compute_marketplace.status === "in_marketplace"
                    ) ? "Active" : "Inactive"
      
                    return (
                      <span className={`computes-list__status ${className}`}>
                        {statusText}
                      </span>
                    )
                  },
                },
                {
                  label: "Install Status",
                  noWrap: true,
                  sortable: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => {
                    const className = (
                     dataRow.compute_install === "completed"
                    ) ? "available" : "pause";
      
                    const statusText = (
                      dataRow.compute_install === "completed"
                    ) ? "Completed" : dataRow.compute_install === "failed" ?
                    "Failed" : "Installing"
      
                    return (
                      <span className={`computes-list__status ${className}`}>
                        {statusText}
                      </span>
                    )
                  },
                },
                {
                  label: "Actions",
                  align: "LEFT",
                  noWrap: true,
                  renderer: (dataRow: TComputeMarketplaceRentedCard) => (
                    <TableActions
                      actions={[
                        // {
                        //   icon: "EDIT",
                        //   onClick: () =>
                        //     navigate(`/computes/${dataRow.id}`),
                        // },
                        {
                          icon: "DELETE",
                          onClick: () => onDeleteCompute(dataRow.id),
                        },
                      ]}
                    />
                  ),
                },
              ]}
              data={rentedGpus?.results ?? []}
            />*/}

                <div className="p-computes-supplier-ai__list">
                  {(rentedGpusList ?? []).map((item) => {
                    let config: any = {};
                    try {
                      if(typeof (item.compute_marketplace.config === 'object')){
                        config =(item.compute_marketplace.config ?? "{}");
                      }else{
                        config = JSON.parse(item.compute_marketplace.config ?? "{}");
                      }
                    } catch (e) {
                      if (window.APP_SETTINGS.debug) {
                        console.error(e);
                      }
                    }
                    const specs: { cpu: string | null } = {
                      cpu: config.hasOwnProperty("cpu") && config.cpu ? config.cpu : null,
                    };

                    let price = null;

                    if (item.compute_marketplace.is_using_cpu) {
                      price = item.compute_marketplace.cpu_price;
                    } else if (item.prices) {
                      price = "$" + item.prices.price;
                    }

                    let ip = null;

                    ip = (item.compute_marketplace.ip_address ? item.compute_marketplace.ip_address : "??") + ":" + item.compute_marketplace.port;
                    return (
                      <RentedComputeItem
                        infrastructure_id = {item.compute_marketplace?.infrastructure_id}
                        key={"compute-" + item.id}
                        install_logs = {item.install_logs}
                        compute_id={item.id}
                        datacenter={item.compute_gpu?.datacenter}
                        location={item.compute_gpu?.location_name ?? item.compute_marketplace?.location_name}
                        machine_type="Virtual Machine"
                        service={(item.service_type ?? "full").toUpperCase()}
                        gpu_tflops={item.compute_gpu?.gpu_tflops}
                        max_cuda_version={item.compute_gpu?.max_cuda_version}
                        per_gpu_ram={item.compute_gpu?.gpu_memory}
                        per_gpu_memory_bandwidth={item.compute_gpu?.gpu_memory_bandwidth}
                        motherboard={item.compute_gpu?.motherboard}
                        number_of_pcie_per_gpu={item.compute_gpu?.number_of_pcie_per_gpu}
                        cpu={specs.cpu}
                        eff_out_of_total_nu_of_cpu_virtual_cores={item.compute_gpu?.eff_out_of_total_nu_of_cpu_virtual_cores}
                        eff_out_of_total_system_ram={item.compute_gpu?.eff_out_of_total_system_ram}
                        internet_down_speed={item.compute_gpu?.internet_down_speed}
                        internet_up_speed={item.compute_gpu?.internet_up_speed}
                        source={item.type}
                        rentingHours={formatFloat(dayjs().diff(dayjs(item.time_start), "hour", true))}
                        remainingHours={formatFloat(dayjs(item.time_end).diff(dayjs(), "hour", true))}
                        price={price}
                        ip={ip}
                        provider_id={item.provider_id}
                        name={item.compute_marketplace.is_using_cpu ? config?.name : item.compute_gpu?.gpu_name}
                        installStatus={item.compute_install ?? null}
                        onDeleteCompute={onDeleteCompute}
                        onNotificationCompute={onNotificationCompute}
                        type={item.compute_marketplace.type}
                        schema={item.schema}
                        history_id={item.id}
                      />
                    );
                  })}
                </div>

                {(rentedGpus?.count ?? 0) > 10 && (
                  <Pagination
                    page={page}
                    pageSize={10}
                    total={rentedGpus?.count ?? 0}
                    setPage={setPage}
                    target="computes"
                  />
                )}
                {createPortal(
                  <Tooltip
                    key={"auto-provision"}
                    id={"auto-provision"}
                    className="p-computes-supplier-ai__tooltip"
                  />,
                  document.body
                )}
                <PreferenceModal
                  isOpen={openPreferenceModalOption.isOpen}
                  title={openPreferenceModalOption.title}
                  onCancel={handleCancelPreferenceModal}
                  onSubmit={handleSubmitPreferenceModal}
                />
              </div>
            ) : (
              <Deposit
                priceDetailGPU={50}
                onHandleRent={handleBuy}
                setIsDeposit={v => setIsDeposit(v)}
                customTitle="Amount to Deposit:"
                customNote="Whenever computing resources are auto-scaled, you will be notified to top up your balance for continued stability."
              />
            )
          }
        </>
      ) : (<EmptySetupComputes />)}
    </>
  )
};

export default ComputesPage;
