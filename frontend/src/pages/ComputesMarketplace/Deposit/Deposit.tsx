import { Fragment, ReactNode, useEffect, useMemo /*, useState*/ } from "react";
import "./Deposit.scss";
import {
  IconArrowLeft,
  IconDeleteComputes,
  IconInfoBlack,
} from "../../../assets/icons/Index";
import { DEPOSIT_STEP, PRICE_FP } from "../../../constants/projectConstants";
import IconCircleChecked from "../../../assets/icons/IconCircleChecked";
import Select, { DataSelect } from "../../../components/Select/Select";
import { compute_types } from "../../../constants/computeType";
import InputBase from "../../../components/InputBase/InputBase";
import IconAddComputes from "../../../assets/icons/IconAddComputes";
import { useNavigate } from "react-router-dom";
import { SelectedOption } from "../Index";
import { formatFloat } from "@/utils/customFormat";
import Topup from "../../../components/Topup/Topup";
import { TComputeMarketplaceCartDiskSizes } from "../../ComputesMarketplaceV2/Index";
import { useMarketplaceProvider } from "@/pages/Marketplace/MarketplaceProvider";

export interface TDeposit {
  priceDetailGPU: number;
  onHandleRent: () => void;
  onHandleRentCrypto?: () => void;
  customTitle?: string;
  customNote?: ReactNode;
  listCardCharge?: SelectedOption[];
  setIsDeposit?: (isDeposit: boolean) => void;
  onHandleDeleteCard?: (id: string) => void;
  isMarketPleaces?: boolean;
  balance?: number;
  diskSizes?: TComputeMarketplaceCartDiskSizes;
  preview?: string | null
}

const Deposit = ({
  customTitle,
  customNote,
  priceDetailGPU,
  onHandleRent,
  listCardCharge,
  setIsDeposit,
  onHandleDeleteCard,
  isMarketPleaces = false,
  diskSizes = {},
  preview,
  onHandleRentCrypto,
}: TDeposit) => {
  const navigate = useNavigate();
  const { setPreviewTemplateModal } = useMarketplaceProvider();
  const dataSelect = [{ label: compute_types.label, options: compute_types.options }];

  const getServiceCompute = (value: string) => {
    switch (value) {
      case 'storage':
        return 'Storage';
      case 'model-training':
        return 'Model Training';
      case 'label-tool':
        return 'Labeling Tool';
      default:
        return 'All';
    }
  }

  const totalPrice = useMemo(() => {
    return listCardCharge?.reduce(
      (acc: any, item: SelectedOption) => acc + item.price * item.quantity * item.hours, 0
    ) ?? priceDetailGPU;
  }, [listCardCharge, priceDetailGPU]);

  useEffect(() => {
    if (totalPrice > 0) {
      return;
    }

    setIsDeposit?.(false);
  }, [isMarketPleaces, navigate, setIsDeposit, totalPrice]);

  return (
    <>
      <div className="c-header-settings">
        <div className="c-step parent">
          {DEPOSIT_STEP?.map((step, index) => (
            <Fragment key={`step-key-${step.title}`}>
              <div className={`c-step-item allow ${index === 0 ? 'active' : ''}`} key={`key-${step}`}>
                <div className="c-step-item__number">
                  <IconCircleChecked />
                </div>
                <span className="c-step-item__title">{step.title}</span>
              </div>
              {index !== DEPOSIT_STEP.length - 1 && (
                <span className="c-step__line">
                  <IconArrowLeft />
                </span>
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="deposit-wrapper full">

        {customTitle && (
          <div className="deposit-card--header">
            <div className="deposit-card--header__title">
              <IconInfoBlack />
              <p>{customTitle}</p>
            </div>
            <div className="deposit-card--header__action">
              {preview && (
                <div style={{ marginRight: "0.5rem" }} className="deposit-card--header__action--button" onClick={() => setPreviewTemplateModal({ open: true, datasource: preview })}>
                  <p>Preview</p>
                </div>
              )}
              <div className="deposit-card--header__action--button" onClick={() => navigate("/marketplace/workflow")}>
                <p>Go back</p>
                <IconArrowLeft />
              </div>
            </div>
          </div>
        )}
        {customNote && (
          <div className="deposit-content">
            <div className="deposit-card--content">
              {customNote}
            </div>
          </div>
        )}
        {listCardCharge?.length && isMarketPleaces ? <div className="deposit-card">
          <div className="deposit-card--header">
            <div className="deposit-card--header__title">
              <IconInfoBlack />
              <p>List computes to rent</p>
            </div>
            <div className="deposit-card--header__action" onClick={() => setIsDeposit?.(false)}>
              <p>Add computes</p>
              <IconAddComputes />
            </div>
          </div>
          <div className="deposit-card--content">
            {listCardCharge?.map((card) => {
              return (
                <div className="cart--block__item" key={"cart-item-" + card.id}>
                  <div className="info-card">
                    <div className="info-card--wrap">
                      <div className="col-1">
                        <div className="title">
                          {card.label}
                        </div>
                        <div className="content">
                          <Select
                            key={`option-2`}
                            // defaultValue={listOption[0]}
                            // data={listOption}
                            placeholderText={getServiceCompute(card.services)}
                            defaultValue={{ value: card.services, label: getServiceCompute(card.services) }}
                            data={(dataSelect as DataSelect[]) ?? []}
                            disabled={true}
                          />
                        </div>
                      </div>
                      <div className="col-2">
                        <div className="title">
                          Hours
                        </div>
                        <InputBase value={String(card.hours)} allowClear={false} disabled={true} />
                      </div>
                      <div className="col-3">
                        <div className="title">
                          Quality
                        </div>
                        <InputBase value={String(card.quantity)} allowClear={false} disabled={true} />
                      </div>
                    </div>
                    <div className="info-card--detail">
                      Os:&nbsp;
                      <span>{card.results?.os ?? "???"}&nbsp;</span>
                      -
                      Ram:&nbsp;
                      <span>{card.results?.ram ? formatFloat(parseFloat(card.results.ram)) + " GB" : "???"}&nbsp;</span>
                      -
                      Disk:&nbsp;
                      <span>
                        {card.results?.diskType}
                        &nbsp;
                        {
                          card.id in diskSizes
                            ? formatFloat(parseFloat(diskSizes[card.id]), 1) + " GB"
                            : "???"
                        }
                        &nbsp;
                      </span>
                    </div>
                    <div className="info-card--price">
                      Price Unit:&nbsp;
                      <span>{formatFloat(card.price * card.hours * card.quantity, PRICE_FP)}&nbsp;{card.tokenSymbol}</span>
                    </div>
                  </div>
                  <div className="actions" onClick={() => onHandleDeleteCard?.(card.id)}>
                    <div className="actions-wrap">
                      <IconDeleteComputes />
                    </div>
                  </div>
                </div>)
            })}
          </div>
        </div> : null}

        <div className="deposit-content">
          {/*<div className="deposit-content__title">
            <IconInfoBlack />
            <p>Total</p>
          </div>
          
          {!isMarketPleaces &&
            <>
              <div className="deposit-content__line">
                <div className="line-dotted"></div>
              </div>
            </>
          }*/}
          <Topup
            amount={totalPrice}
            gateway="STRIPE"
            onFinish={() => {
              setIsDeposit?.(false);
              onHandleRent();
            }}
            onFinishCrypto={onHandleRentCrypto}
          />
        </div>
      </div>
    </>
  );
};

export default Deposit;
