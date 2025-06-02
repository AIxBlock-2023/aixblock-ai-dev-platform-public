import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import IconBook from "@/assets/icons/IconBook";
import IconDePoSit from "@/assets/icons/IconDePoSit";
import IconWithDraw from "@/assets/icons/IconWithDraw";
// import Checkbox from "@/components/Checkbox/Checkbox";
import { useUserLayout } from "@/layouts/UserLayout";
import "./index.scss";
import DepositModal from "./modal/DepositModal";
import WithdrawModal from "./modal/WithdrawModal";
import useUserPortfolio from "../../hooks/user/useUserPortfolio";
import { PRICE_FP, TOKEN_SYMBOL_DEFAULT } from "@/constants/projectConstants";
import {
  formatFloat,
  formatWalletAddress,
  formatOnchainBalance,
} from "@/utils/customFormat";
import { toastError, toastInfo } from "@/utils/toast";
import solanaRPCParticle from "../../solanaRPCParticle";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { getTokenByChainId } from "@/utils/solanaAddress";
import useUserTransactionsHook from "@/hooks/user/useUseTransactionsHook";
import Pagination from "@/components/Pagination/Pagination";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import { formatDate } from "@/utils/formatDate";
import CustomAmount from "@/components/Topup/CustomAmount";
import IconPlusCircle from "@/assets/icons/IconPlusCircle";
import { infoDialog } from "@/components/Dialog";
import VideoPlayer from "@/components/VideoPlayer/VideoPlayer";
import { VIDEO_URL } from "@/constants/projectConstants";
import {
  useModal,
  useDisconnect,
  useAccount,
} from "@particle-network/connectkit";

export interface IOnchainBalance {
  solBalance: string;
  usdcBalance: string;
}

const WalletPage = () => {
  const [openDepositModal, setOpenDepositModal] = useState(false);
  const [openWithdrawModal, setOpenWithdrawModal] = useState(false);
  const userLayout = useUserLayout();
  const navigate = useNavigate();
  const portfolio = useUserPortfolio(TOKEN_SYMBOL_DEFAULT);
  const [onchainBalance, setOnchainBalance] = useState<IOnchainBalance>({
    solBalance: "0",
    usdcBalance: "0",
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copiedText, copy] = useCopyToClipboard();
  const {
    list,
    page,
    setPage,
    pageSize,
    loading,
    loadingError,
    total,
    refresh,
  } = useUserTransactionsHook();
  const [isCustomAmount, setIsCustomAmount] = React.useState(false);
  const { isConnected: connectedParticle, chainId, address } = useAccount();
  const { setOpen } = useModal();

  const { disconnect } = useDisconnect();

  React.useEffect(() => {
    userLayout.setBreadcrumbs([{ label: "Payment" }]);
    userLayout.setCloseCallback("/projects");
    userLayout.setActions([
      // Todo: wait logic when click button
      {
        icon: <IconPlusCircle />,
        label: "Fiat balance",
        onClick: () => setIsCustomAmount(true),
      },
      {
        icon: <IconBook />,
        label: "Wallet setup tutorial",
        onClick: () => {
          infoDialog({
            cancelText: null,
            className: "model-demo-video",
            message: <VideoPlayer url={VIDEO_URL.WALLET_SETUP} />,
          });
        },
      },
    ]);
    return () => {
      userLayout.clearBreadcrumbs();
      userLayout.clearCloseCallback();
      userLayout.clearActions();
    };
  }, [userLayout, navigate]);

  const login = async () => {
    try {
      if (connectedParticle) {
        await disconnect();
        return;
      }
      setOpen(true);
    } catch (e: any) {
      toastError(e.message || "Connect wallet failed");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (connectedParticle && address && chainId) {
          const rpc = new solanaRPCParticle(chainId);

          const [solBalance, usdcBalance] = await Promise.all([
            rpc.getBalance(address),
            rpc.getTokenBalance(
              address,
              getTokenByChainId(chainId).USDC.address
            ),
          ]);
          setOnchainBalance({
            solBalance,
            usdcBalance,
          });
        } else {
          setOnchainBalance({
            solBalance: "0",
            usdcBalance: "0",
          });
     }
      } catch (error) {
        toastError("Get wallet address failed");
      }
    };

    init();
  }, [address, chainId, connectedParticle]);

  const copyAddress = () => {
    if (!address || address === "") return;
    copy(address);
    toastInfo("Copied to clipboard");
  };

  return (
    <div className="wallet-container">
      <div className="left-side">
        <div className="left-side-list">
          {/*<div className="left-side-list-search">
            <input placeholder="Search asset" />
          </div>*/}
          {loading ? (
            <EmptyContent message="Getting transactions..." />
          ) : loadingError ? (
            <EmptyContent
              message={loadingError}
              buttons={[{ children: "Retry", onClick: refresh }]}
            />
          ) : (
            <>
              <div className="left-side-list-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                          <em>(empty list)</em>
                        </td>
                      </tr>
                    )}
                    {list.map((t) => (
                      <tr key={"transaction-" + t.id}>
                        <td className="left-side-list-table__name">
                          <div>Transaction #{t.id}</div>
                          <div>{t.type ?? <em>(no type)</em>}</div>
                        </td>
                        <td className="left-side-list-table__email">
                          <div>
                            {t.amount ? (
                              <code>
                                {t.amount > 0 ? "+" : ""}
                                {t.amount}
                              </code>
                            ) : (
                              <em>(no amount)</em>
                            )}
                          </div>
                          <div>{formatDate(t.created_at, "MMM. D, YYYY")}</div>
                        </td>
                        <td className="left-side-list-table__status">
                          <span className="done">
                            {t.unit ? t.unit.toUpperCase() : <em>(no unit)</em>}
                          </span>
                        </td>
                        <td className="left-side-list-table__method">
                          <span>{t.network ?? <em>(no network)</em>} </span>
                          <span>
                            • {t.description ?? <em>(no description)</em>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="left-side-pagination">
                <Pagination
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  setPage={setPage}
                  target="user/wallet"
                />
              </div>
            </>
          )}
        </div>
      </div>
      <div className="right-side">
        <div className="right-side-price">
          <div className="right-side-price-earning right-side-price__frame">
            <div className="right-side-price__title">
              Wallet Address (Solana network)
            </div>
            <div
              className="right-side-price-earning right-side-price__frame"
              onClick={copyAddress}
            >
              <div className="right-side-price__title">
                {formatWalletAddress(address)}
              </div>
            </div>
          </div>
          <div className="right-side-currency-box-bottom">
            <div
              className="right-side-currency-box-bottom-connect-wallet-item"
              onClick={login}
            >
              <IconDePoSit />
              <span>{connectedParticle ? "Disconnect" : "Connect wallet"}</span>
            </div>
            <div
              className="right-side-currency-box-bottom-item"
              onClick={() => setOpenDepositModal(true)}
            >
              <IconDePoSit />
              <span>Deposit</span>
            </div>
            <div
              className="right-side-currency-box-bottom-item"
              onClick={() => setOpenWithdrawModal(true)}
            >
              <IconWithDraw />
              <span>Withdraw</span>
            </div>
          </div>
        </div>

        <div className="right-side-price">
          <div className="right-side-price-earning right-side-price__frame">
            <div className="right-side-price__title">Total Earning</div>
            <div className="right-side-price__price">$0</div>
          </div>
        </div>
        <div className="right-side-currency-box">
          <div className="right-side-currency-box-price">
            <div className="right-side-currency-box-price-icon"></div>
            <div className="right-side-currency-box-price-content">
              <div className="right-side-currency-box-price-content-title">
                ${formatFloat(portfolio.balance, PRICE_FP)}
              </div>
              <div className="right-side-currency-box-price-content-title">
                {formatOnchainBalance(onchainBalance.solBalance)} SOL
              </div>
              <div className="right-side-currency-box-price-content-title">
                {onchainBalance.usdcBalance} USDC
              </div>
              <div className="right-side-currency-box-price-content-des">
                Your balance is equivalent
              </div>
            </div>
          </div>
        </div>
      </div>
      <DepositModal
        walletAddress={address ?? ""}
        open={openDepositModal}
        onCancel={setOpenDepositModal}
      />
      <WithdrawModal open={openWithdrawModal} onCancel={setOpenWithdrawModal} />
      <CustomAmount
        isOpen={isCustomAmount}
        onClose={() => setIsCustomAmount(false)}
        onFinish={() => {
          portfolio.refresh();
          refresh();
        }}
      />
    </div>
  );
};

export default WalletPage;
