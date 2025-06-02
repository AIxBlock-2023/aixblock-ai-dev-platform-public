import { useState, useEffect, useCallback } from "react";
// import Modal from "@/components/Modal/Modal";
import DepositWithAXBModal from "./DepositWithAXBModal";
import "./DepositAndWithdrawModal.scss";
import DepositBuyAXBModal from "./DepositBuyAXBModal";
import { toastError } from "@/utils/toast";
import { useConnect } from "@particle-network/authkit";

type DepositModalProps = {
  open: boolean;
  walletAddress: string;
  onCancel: (open: boolean) => void;
  onBuy?: () => void;
};

const DepositModal = (props: DepositModalProps) => {
  const [openDepositWithAXBModal, setOpenDepositWithAXBModal] = useState(false);
  const [openDepositBuyAXBModal, setOpenDepositBuyAXBModal] = useState(false);
  const { connected: connectedParticle } = useConnect();

  const onOpenDepositWithAXBModal = useCallback(() => {
    if (connectedParticle) {
      setOpenDepositWithAXBModal(true);
    } else {
      toastError("Wallet is not connected yet. Please connect your wallet.");
    }
  }, [connectedParticle]);

  // Khi props.open là true, tự động mở modal DepositWithAXBModal (crypto)
  useEffect(() => {
    if (props.open) {
      onOpenDepositWithAXBModal();
    } else {
      setOpenDepositWithAXBModal(false);
      setOpenDepositBuyAXBModal(false);
    }
  }, [onOpenDepositWithAXBModal, props.open]);

  return (
    <>
      {/*
      <Modal
        title="Choose option deposit"
        open={props.open}
        onCancel={() => props.onCancel(false)}
        className="wallet-modal wallet-modal__deposit"
      >
        <div className="wallet-modal-content">
          <img
            src={require("@/assets/images/deposit.png")}
            alt="Deposit"
          />
          <div className="wallet-modal-group-btn">
            <button
              className="wallet-modal-btn wallet-modal-btn__dark"
              onClick={() => onOpenDepositWithAXBModal()}
            >
              Deposit with crypto
            </button>
            {/* <button
              className="wallet-modal-btn wallet-modal-btn__light"
              onClick={() => setOpenDepositBuyAXBModal(true)}
            >
              Buy AXB
            </button> 
          </div>
        </div>
      </Modal>
      */}
      <DepositWithAXBModal
        open={openDepositWithAXBModal}
        onCancel={(open) => {
          setOpenDepositWithAXBModal(open);
          props.onCancel(open);
        }}
        walletAddress={props.walletAddress}
      />
      <DepositBuyAXBModal
        open={openDepositBuyAXBModal}
        onCancel={setOpenDepositBuyAXBModal}
        onHandleBuy={props.onBuy}
      />
    </>
  );
};

export default DepositModal;
