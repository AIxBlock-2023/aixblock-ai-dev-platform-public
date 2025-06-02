import {useApi} from "../../providers/ApiProvider";
import {usePromiseLoader} from "../../providers/LoaderProvider";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import {OnApproveData} from "@paypal/paypal-js/types/components/buttons";
import {PayPalButtons, PayPalButtonsComponentProps} from "@paypal/react-paypal-js";
import {infoDialog} from "../Dialog";
import styles from "./Topup.module.scss";
import {formatFloat} from "@/utils/customFormat";
import {PRICE_FP, TOKEN_SYMBOL_DEFAULT} from "@/constants/projectConstants";
import Button from "../Button/Button";
import useUserPortfolio from "@/hooks/user/useUserPortfolio";
import {toastError, toastSuccess} from "@/utils/toast";
import useStripeProvider from "@/providers/StripeProvider";
import {IconInfoV2} from "@/assets/icons/IconInfoV2";
import {Tooltip} from "react-tooltip";
import CustomAmount from "./CustomAmount";
import { getTokenByChainId } from "../../utils/solanaAddress";
import { IOnchainBalance } from "../../pages/Wallet";
import { useConnect } from "@particle-network/authkit";
import { useSolana } from "@particle-network/authkit";
import SolanaRpcParticle from "@/solanaRPCParticle";

const payPalStyles: PayPalButtonsComponentProps["style"] = {
  shape: "rect",
  height: 36,
  layout: "horizontal",
  color: "blue",
}

export type TProps = {
  amount: number;
  note?: string;
  onFinish?: () => void;
  gateway?: "PAYPAL" | "STRIPE",
  onFinishCrypto?: () => void;
}

export default function Topup({amount, note, onFinish, gateway = "STRIPE", onFinishCrypto}: TProps) {
  const portfolio = useUserPortfolio(TOKEN_SYMBOL_DEFAULT);
  const {call} = useApi();
  const {addPromise} = usePromiseLoader();
  const stripe = useStripeProvider();
  const [isCustomAmount, setIsCustomAmount] = React.useState(false);
  const [onchainBalance, setOnchainBalance] = useState<IOnchainBalance>({
    solBalance: "0",
    usdcBalance: "0",
  });
  const { connected: connectedParticle } = useConnect();

  const {
    address, // Solana public address
    chainId, // Current chain (Mainnet, Testnet, Devnet)
  } = useSolana();
  
  const depositAmount = useMemo(() => {
    if (amount > portfolio.balance) {
      return amount - portfolio.balance;
    }

    return 0;
  }, [portfolio.balance, amount]);

  const depositAmountWithFee = useMemo(() => {
    if (gateway === "STRIPE") {
      return depositAmount + stripe.getFee(depositAmount);
    }

    if (depositAmount === 0) {
      return 0;
    }

    // oldPrice = newPrice - (newPrice * 0.053 + 0.3)
    // oldPrice = newPrice - (newPrice * 0.053) - 0.3
    // oldPrice + 0.3 = newPrice * (1 - 0.053)
    // newPrice = (oldPrice + 0.3) / (1 - 0.053)

    return (depositAmount + 0.49) / (1 - 0.0499);
  }, [depositAmount, gateway, stripe]);

  const paymentGatewayFee = useMemo(() => {
    return depositAmountWithFee - depositAmount;
  }, [depositAmount, depositAmountWithFee]);

  useEffect(() => {
      const init = async () => {
        try {
          if (connectedParticle && address && chainId) {
            const rpc = new SolanaRpcParticle(chainId);
  
            const [solBalance, usdcBalance] = await Promise.all([
              rpc.getBalance(address),
              rpc.getTokenBalance(address, getTokenByChainId(chainId).USDC.address),
            ]);
            setOnchainBalance({
              solBalance,
              usdcBalance,
            });
          }  
        } catch (error) {
          // toastError("Get wallet address failed");
        }
      };
  
      init();
    }, [connectedParticle, address, chainId]);

  const createPayPalOrder = useCallback(async () => {
    console.log(depositAmountWithFee);

    const ar = call("createPayPalOrder", {
      body: {amount: depositAmountWithFee},
    });

    addPromise(ar.promise, "Creating new order...");
    const res = await ar.promise;
    const data = await res.json();

    if (!data.id) {
      const errorDetail = data?.details ?? [0];
      const errorMessage = errorDetail
        ? `${errorDetail.issue} ${errorDetail.description} (${data.debug_id})`
        : "Unexpected error occurred, please try again.";

      throw new Error(errorMessage);
    }

    return data["id"];
  }, [addPromise, call, depositAmountWithFee]);

  const capturePayPalOrder = useCallback(async (data: OnApproveData) => {
    const ar = call("capturePayPalOrder", {
      body: {order_id: data.orderID},
    });

    addPromise(ar.promise, "Processing you payment...");
    const res = await ar.promise;

    if (res.ok) {
      onFinish?.();
    } else {
      throw new Error("Unexpected error occurred, please try again.");
    }
  }, [addPromise, call, onFinish]);

  const payPalButton = useMemo(() => {
    if (depositAmount === 0) {
      return null;
    }

    return (
      <PayPalButtons
        disabled={portfolio.loading}
        key={depositAmount}
        style={payPalStyles}
        createOrder={createPayPalOrder}
        onApprove={capturePayPalOrder}
        onError={err => {
          infoDialog({
            title: "Payment Error",
            message: (err.message as unknown as string) ?? "Unexpected error occurred, please try again.",
          })
        }}
      />
    );
  }, [capturePayPalOrder, createPayPalOrder, depositAmount, portfolio.loading]);

  const onStripeFinish = useCallback(() => {
    toastSuccess("Your transaction has been completed successfully");
    onFinish?.();
  }, [onFinish]);

  const onStripeError = useCallback((message: string) => {
    toastError(message);
  }, []);

  const onStripeDeposit = useCallback(() => {
    stripe.topup(depositAmountWithFee, onStripeFinish, onStripeError)
  }, [depositAmountWithFee, onStripeError, onStripeFinish, stripe]);

  return (
    <>
      <div className={`${styles.topup}`}>
        <div className={styles.topupContent}>
          {note &&
            <>
              <div className={styles.topupContentNotice}>
                <div className={styles.topupContentNoticeTitle}>Note:</div>
                <div className={styles.topupContentNoticeContent}>{note}</div>
              </div>
              <div className={styles.topupContentLine}>
                <div className={styles.topupContentLineDotted}></div>
              </div>
            </>
          }
          {portfolio.balance !== 0.0 && <>
            <div className={styles.topupContentTotal}>
              <p className={styles.topupContentTotalAmount}>Current Fiat Balance <sup>(1)</sup></p>
              <p className={styles.topupContentTotalPrice}>{formatFloat(portfolio.balance ?? 0, PRICE_FP)} {TOKEN_SYMBOL_DEFAULT}</p>
            </div>
            {connectedParticle && address && chainId && <>
            <div className={styles.topupContentTotal}>
                <p className={styles.topupContentTotalAmount}>Current Crypto balance <sup>(2)</sup> </p>
                <p className={styles.topupContentTotalPrice}>{onchainBalance.usdcBalance} {TOKEN_SYMBOL_DEFAULT}</p>
              </div>
            </>}
            <div className={styles.topupContentTotal}>
              <p className={styles.topupContentTotalAmount}>Total amount <sup>(2)</sup></p>
              <p
                className={styles.topupContentTotalPrice}>{formatFloat(amount, PRICE_FP)} {TOKEN_SYMBOL_DEFAULT}</p>
            </div>
          </>}
          {depositAmount > 0 && <div className={styles.topupContentTotal}>
            <p className={styles.topupContentTotalAmount}>
              Deposit amount <sup>(3) {portfolio.balance !== 0.0 && "= (2) - (1)"}</sup>
            </p>
            <p
              className={styles.topupContentTotalPrice}>{formatFloat(depositAmount, PRICE_FP)} {TOKEN_SYMBOL_DEFAULT}</p>
          </div>}
          {paymentGatewayFee > 0 && <div className={styles.topupContentTotal}>
            <p className={styles.topupContentTotalAmount}>
              Estimated Transaction Fee <IconInfoV2 id="topup-fee" width={12} height={12}/> <sup>(4)</sup>
              <Tooltip
                place="top"
                positionStrategy="fixed"
                content="Transaction fees may vary. In some cases, you might even receive a refund if the actual fee is lower than estimated. Any excess amount will be credited back to your wallet."
                anchorSelect={"#topup-fee"}
                style={{maxWidth: 360}}
              />
            </p>
            <p className={styles.topupContentTotalPrice}>{formatFloat(paymentGatewayFee, PRICE_FP)} {TOKEN_SYMBOL_DEFAULT}</p>
          </div>}
          {depositAmountWithFee > 0 && <div className={styles.topupContentTotal}>
            <p className={styles.topupContentTotalAmount}>
              <strong>TOTAL <sup>(3) + (4)</sup></strong>
            </p>
            <p className={styles.topupContentTotalPrice}>
              <strong>{formatFloat(depositAmountWithFee, PRICE_FP)} {TOKEN_SYMBOL_DEFAULT}</strong>
            </p>
          </div>}
          <p className={styles.topupTip}>
            Tip: Add a larger credit to your wallet to reduce payment gateway fees. Stripe charges a fee per transaction.
            Your credit is refundable, and you can withdraw any unused amount anytime.
          </p>
          <div className={styles.topupContentAction}>
            {
              portfolio.loading
                ? <small>Refreshing account's balance...</small>
                : <Button onClick={() => setIsCustomAmount(true)} type="secondary">Add Credits to fiat balance</Button>
            }
            {
              depositAmount === 0
                ? <Button onClick={onFinish}>Pay with fiat</Button>
                : gateway === "STRIPE"
                  ? <Button onClick={onStripeDeposit} disabled={portfolio.loading}>Deposit</Button>
                  : payPalButton
            }
            {
              portfolio.loading
                ? <small>Refreshing account's balance...</small>
                : onFinishCrypto && <Button onClick={onFinishCrypto} type="secondary">Pay with crypto</Button>
            }
          </div>
        </div>
      </div>
      <CustomAmount isOpen={isCustomAmount} onClose={() => setIsCustomAmount(false)} onFinish={portfolio.refresh} />
    </>
  );
}
