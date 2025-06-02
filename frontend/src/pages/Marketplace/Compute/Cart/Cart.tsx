import React, {useMemo, useRef} from "react";
import IconClose from "@/assets/icons/IconClose";
import {useUserLayout} from "@/layouts/UserLayout";
import Select from "@/components/Select/Select";
import {compute_types} from "@/constants/computeType";
import InputBase from "@/components/InputBase/InputBase";
import IconDeleteComputes from "@/assets/icons/IconDeleteComputes";
import Button from "@/components/Button/Button";
import {PRICE_FP} from "@/constants/projectConstants";
import {formatFloat} from "@/utils/customFormat";
import {TComputeMarketplaceV2SelectedOption} from "../types";
import "./Cart.scss";
import useOnClickOutside from "@/hooks/useOnClickOutside";
// import Slider from "rc-slider";
import {TComputeMarketplaceCartDiskSizes} from "../Index";

type TCartProps = {
  selectedCard: TComputeMarketplaceV2SelectedOption[]
  setIsDeposit: (isDeposit: boolean) => void
  onHandleDelete: (id: string) => void
  onHandleChangeHours: (value: string, id: string) => void
  onHandleChangeQuality: (value: string, id: string) => void
  onHandleChangeDiskSize: (value: string, id: string) => void
  onHandleServices: (value: string, id: string) => void
  diskSizes?: TComputeMarketplaceCartDiskSizes
}

const Cart = ({
                selectedCard,
                setIsDeposit,
                onHandleDelete,
                onHandleChangeHours,
                onHandleChangeQuality,
                onHandleChangeDiskSize,
                onHandleServices,
                diskSizes = {},
              }: TCartProps) => {
  const userLayout = useUserLayout();
  const cartRef = useRef<HTMLElement | null>(null);

  useOnClickOutside(cartRef, () => {
    userLayout.setOpenCart(false);
  });

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

  const canCheckout = useMemo(() => {
    if (selectedCard.length === 0) {
      return false;
    }

    let isValid = true;

    selectedCard.forEach(c => {
      isValid = isValid && (c.quantity > 0 && c.price > 0);
    });

    return isValid;
  }, [selectedCard]);

  return (
    <div className={`p-computes-marketplace-v2-cart ${userLayout.isShowCart ? 'isOpen' : ''}`}
         ref={r => cartRef.current = r}>
      <div className="cart--header">
        <IconClose onClick={() => {
          userLayout.setOpenCart(false);
        }}/>
        <p className="cart--header__title">
          Your cart
          <span> ( {selectedCard.length || 0} )</span>
        </p>
      </div>
      <div className="cart--txt">
        <p>
          It's highly recommended to use separate computes for each service. Just a small note: Storage service needs to
          have big disks. Model training service needs to have GPUs.
        </p>
      </div>
      <div className="cart--block">
        {selectedCard.map((card, index) => {

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
                        key={index}
                        isCreatePortal={false}
                        defaultValue={{value: card.services, label: getServiceCompute(card.services)}}
                        // defaultValue={{label: SERVICES_LIST["model-training"], value: "model-training"}}
                        data={[{
                          label: compute_types.label,
                          // options: [
                          //   {label: SERVICES_LIST["model-training"], value: "model-training"},
                          // ],
                          options: compute_types.options.filter((o: {label: string, value: string}) => {
                            return card.canInstallAllService ? true : o.value !== "full";
                          }),
                        }]}
                        onChange={(value) => {
                          onHandleServices(value.value, card.id)
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-2">
                    <div className="title">
                      Hours
                    </div>
                    <InputBase
                      onChange={(e) => {
                        onHandleChangeHours(e.target.value, card.id);
                      }}
                      allowClear={false}
                      type="number"
                      className='input-card-custom'
                      value={String(card.hours)}
                      readonly={false}
                    />
                  </div>
                  <div className="col-3">
                    <div className="title">
                      Quantity
                    </div>
                    <InputBase
                      onChange={(e) => {
                        onHandleChangeQuality(e.target.value, card.id);
                      }}
                      allowClear={false}
                      className='input-card-custom'
                      value={String(card.quantity)}
                      disabled={true}
                    />
                  </div>
                </div>
                {/*{card.specs?.diskSize && <div>
                  <Slider
                    className="p-computes-marketplace-v2-filter__slider"
                    min={10}
                    max={parseFloat(card.specs?.diskSize ?? "0")}
                    defaultValue={card.id in diskSizes ? Number(diskSizes[card.id]) : 0}
                    onChange={(v: any) => {
                      onHandleChangeDiskSize(v, card.id);
                    }}
                  />
                </div>}*/}
                <div className="info-card--detail">
                  Os: <strong>{card.specs?.os ?? "???"}</strong>
                  &nbsp;-
                  Ram: <strong>{card.specs?.ram ? formatFloat(card.specs.ram) + " GB" : "???"}</strong>
                  &nbsp;-
                  Disk: <strong>{card.specs?.diskType} {card.id in diskSizes ? formatFloat(parseFloat(diskSizes[card.id]), 1) + " GB" : "???"}</strong>
                </div>
                <div className="info-card--price">
                  Price Unit:&nbsp;
                  <span>{formatFloat(card.quantity * card.price * card.hours, PRICE_FP)}&nbsp;{card.tokenSymbol}</span>
                </div>
              </div>
              <div className="actions">
                <div className="actions-wrap" onClick={() => onHandleDelete(card.id)}>
                  <IconDeleteComputes/>
                </div>
              </div>
            </div>)
        })}
      </div>
      <Button disabled={!canCheckout} className="cart--footer" onClick={() => {
        setIsDeposit(true);
        userLayout.setOpenCart(false);
      }} aria-disabled={!canCheckout}>
        <IconDeleteComputes/>
        <p>Check out</p>
      </Button>
    </div>
  )
}

export default Cart;
