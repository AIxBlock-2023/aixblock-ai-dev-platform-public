import { useNavigate, useSearchParams } from "react-router-dom";
import IconSearch from "@/assets/icons/iconSearch";
import Button from "@/components/Button/Button";
import { confirmDialog, infoDialog } from "@/components/Dialog";
import InputBase from "@/components/InputBase/InputBase";
import Pagination from "@/components/Pagination/Pagination";
import Table, { TableActions } from "@/components/Table/Table";
import {
  TComputeSupply,
  useGetListComputeMarketplace,
} from "@/hooks/computes/useGetListComputeMarketplace";
import { useApi } from "@/providers/ApiProvider";
import { useBooleanLoader } from "@/providers/LoaderProvider";
import EmptyComputesSupplier from "../EmptyComputesSupplier";
import "./Index.scss";
import IconCirclePlus from "@/assets/icons/IconCirclePlus";
// import Select from "@/components/Select/Select";
import { SERVICES, STATUS_COMPUTE } from "@/constants/projectConstants";
import Switch from "@/components/Switch/Switch";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import { Fragment } from "react/jsx-runtime";
import { IconInfoSmall } from "@/assets/icons/Index";
import { useCallback, /*useRef,*/ useState } from "react";
import PreferenceModal, { TAutoProvision } from "../PreferenceModal";
import Deposit from "../../ComputesMarketplace/Deposit/Deposit";

type ComputesSupplierAIBuilderProps = {
  showBtnAdd?: boolean;
};

const pageSize = 10;

const ComputesSupplierAIBuilder = (props: ComputesSupplierAIBuilderProps) => {
  const { showBtnAdd = true } = props;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
	const currentPage = searchParams.get("page");
	const [autoProvision, setAutoProvision] = useState<boolean>(false);
  const [isDeposit, setIsDeposit] = useState(false);
	const [openPreferenceModalOption, setOpenPreferenceModalOption] = useState<{
    isOpen: boolean;
    title: string;
  }>({
    isOpen: false,
    title: "",
  });
  const {
    listData,
    loading,
    count,
    setPage,
    fetchData: refetch,
  } = useGetListComputeMarketplace({
    page: currentPage ? Number(currentPage) : 1,
    type: "supply",
  });
  useBooleanLoader(loading, "Loading list supply...");
  const api = useApi();
  const deleteCompute = (dataRow: TComputeSupply) => {
    confirmDialog({
      message: "Are you sure you want to delete this compute supplier?",
      onSubmit: async () => {
        const isCannotDelete = dataRow?.compute_gpus?.some(
          (c) => c.prices.length
        );
        if (isCannotDelete) {
          infoDialog({
            message: "Cannot delete compute because this compute is rented.",
          });
          return;
        }
        const ar = api.call("deleteCompute", {
          params: { id: dataRow.id.toString() },
        });
        const res = await ar.promise;

        if (res.ok) {
          refetch();
        } else {
          const data = await res.json();
          if (Object.hasOwn(data, "detail")) {
            infoDialog({ message: "Server error: " + data["detail"] });
          } else {
            infoDialog({
              message:
                "An error ocurred while delete compute supplier (" +
                res.statusText +
                "). Please try again!",
            });
          }
          return;
        }
      },
    });
	};
	const handleBuy = () => {
		//todo intergrate deposit flow with Kien
		setIsDeposit(false);
	}
	const handleCancelPreferenceModal = () => {
		setAutoProvision(false)
		setOpenPreferenceModalOption({
			isOpen: false,
			title: "",
		})
	}
	const handleSubmitPreferenceModal = (_data: TAutoProvision) => {
		setOpenPreferenceModalOption({
			isOpen: false,
			title: "",
		})
		setIsDeposit(true);
	}
	const showInfoPreference = (isCustom : boolean) => {
		// confirmDialog({})
		setOpenPreferenceModalOption({
			isOpen: true,
			title: isCustom ? "Custom Preference:" : "Set default Preference:",
		})
	}
	const handleSwitchAutoProvision = useCallback((isChecked: boolean) => {
    if (isChecked === autoProvision) return;
    setAutoProvision(isChecked)
    if (isChecked) {
      confirmDialog({
        title: "Compute Preference:",
        message: `If you set the default, there is no need to reset it and only need to be set once.\n
				If you set the settings, you can customize the parameters each time you turn it on`,
        submitText: "Custom",
        cancelText: "Set default",
				onSubmit: () => {
					showInfoPreference(true)
				},
        onCancel(ref) {
          //define as custom button
					if (ref) {
						showInfoPreference(false)
					} else {
						setAutoProvision(false)
					}
        },
      });
    }
  }, [autoProvision, setAutoProvision]);

  return !isDeposit ? (
    (listData?.results ?? []).length ? (
      <div className="p-computes-supplier-ai">
        <div className="p-computes-supplier-ai__header">
          <div className="p-computes-supplier-ai__block__left">
            <div className="p-computes-supplier-ai__block__input">
              <IconSearch className="p-computes-supplier-ai__block__float-icon" />
              <InputBase placeholder="Search asset" />
            </div>
            <div className="p-computes-supplier-ai__block">
              <span className="active-filter" />
              Active
            </div>
            <div className="p-computes-supplier-ai__block">
              <span className="inactive-filter" />
              Inactive
            </div>
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
                  handleSwitchAutoProvision(isChecked);
                }}
              />
            </div>
            {showBtnAdd && (
              <Button
                type="primary"
                iconPosition="right"
                icon={<IconCirclePlus />}
                onClick={() => navigate("/computes-supplier/add")}
              >
                Add New Compute
              </Button>
            )}
          </div>
        </div>

        <Table
          className="computes-list"
          columns={[
            {
              label: "ID",
              align: "CENTER",
              renderer: (dataRow: TComputeSupply, idx) => (
                <span>{dataRow.id}</span>
              ),
            },
            {
              label: "Compute Info",
              noWrap: true,
              renderer: (dataRow: TComputeSupply) => (
                <span>{dataRow.name ? dataRow.name : "-"}</span>
              ),
            },
            {
              label: "Compute Model",
              noWrap: true,
              align: "CENTER",
              renderer: (dataRow: TComputeSupply) => (
                <span className="computes-list__model">
                  {dataRow.is_using_cpu
                    ? "CPU"
                    : dataRow.compute_gpus?.[0]
                    ? dataRow.compute_gpus?.[0]?.gpu_name
                    : "-"}
                </span>
              ),
            },
            {
              label: "Price Unit",
              noWrap: true,
              renderer: (dataRow: TComputeSupply) => {
								const price = dataRow.is_using_cpu
                ? dataRow.cpu_price
                : dataRow.compute_gpus[0]?.prices[0]?.price;
              return <span>{`${price ? "$"+price+"/hr" : "NA"}`}</span>;
              },
            },
            {
              label: "Rental time start",
              noWrap: true,
              renderer: (_dataRow: TComputeSupply) => (
                <div className="computes-list__multiple-row">
                  <span>22/03/2024</span>
                  <span className="subtitle">12 days 48 mins</span>
                </div>
              ),
            },
            {
              label: "Type",
              noWrap: true,
              sortable: true,
              renderer: (dataRow: TComputeSupply) => (
                <span className="computes-list__type rent">
                  {
                    SERVICES[0].options.find(
                      (type) => type.value === dataRow.compute_type
                    )?.label
                  }
                </span>
              ),
            },
            {
              label: "Status",
              noWrap: true,
              sortable: true,
              renderer: (dataRow: TComputeSupply) => (
                <span className="computes-list__status available">
                  {
                    STATUS_COMPUTE[0].options.find(
                      (stt) => stt.value === dataRow.status
                    )?.label
                  }
                </span>
              ),
            },
            {
              label: "Actions",
              align: "LEFT",
              noWrap: true,
              renderer: (dataRow: TComputeSupply) => (
                <TableActions
                  actions={[
                    {
                      icon: "EDIT",
                      onClick: () =>
                        navigate(`/computes-supplier/${dataRow.id}`),
                    },
                    {
                      icon: "DELETE",
                      onClick: () => deleteCompute(dataRow),
                    },
                  ]}
                />
              ),
            },
          ]}
          data={listData?.results ?? []}
        />
        <Pagination
          page={Number(currentPage ?? 1)}
          pageSize={pageSize}
          total={count}
          setPage={setPage}
          target="computes-supplier"
        />
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
      <EmptyComputesSupplier />
    )
  ) : (
    <Deposit
      priceDetailGPU={10}
      onHandleRent={handleBuy}
      setIsDeposit={v => setIsDeposit(v)}
      customTitle="Amount to Deposit:"
      customNote="Whenever computing resources are auto-scaled, you will be notified to top up your balance for continued stability."
    />
  );
};

export default ComputesSupplierAIBuilder;
