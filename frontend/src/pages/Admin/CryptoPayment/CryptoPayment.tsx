import { useEffect, useState } from "react";
import { useUserLayout } from "@/layouts/UserLayout";
import AdminLayout from "../Layout";

import EmptyContent from "@/components/EmptyContent/EmptyContent";
import { useApi } from "@/providers/ApiProvider";
import { toastError } from "@/utils/toast";
import Button from "@/components/Button/Button";
import styles from "./CryptoPayment.module.scss";
import Modal from "@/components/Modal/Modal";
import WithdrawForm from "./WithdrawForm/Index";
import { getTokenByChainId } from "@/utils/solanaAddress";

const CryptoPayment = () => {
  const userLayout = useUserLayout();
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState<boolean>(true);
  const [isOpenWithdraw, setIsOpenWithdraw] = useState<boolean>(false);
  useState<boolean>(false);
  const api = useApi();

  useEffect(() => {
    userLayout.setBreadcrumbs([{ label: "Account setting" }]);

    return () => {
      userLayout.clearBreadcrumbs();
    };
  }, [userLayout]);

  const onCancelModal = () => {
    setIsOpenWithdraw(false);
  };

  useEffect(() => {
    const setUpApi = async () => {
      if (api) {
        const ar = api.call("adminCryptoPaymentBalance", {
          query: new URLSearchParams({
            address: getTokenByChainId(101).USDC.address,
          }),
        });
        try {
          const data = await ar.promise;
          if (data.ok) {
            const response = await data.json();
            setBalance(response.data.balance);
            setLoading(false);
          }
        } catch (error) {
          console.log(error);
          toastError("Error fetching balance");
        }
      }
    };
    setUpApi();
  }, [api, loading]);

  return (
    <AdminLayout
      title="Crypto Payment admin"
      actions={
        <>
          <Button type="secondary" onClick={() => setIsOpenWithdraw(true)}>
            Withdraw all fund
          </Button>
        </>
      }
    >
      {loading && <EmptyContent message="Loading..." />}
      {!loading && (
        <>
          <div className={styles.topupContentTotal}>
            <p className={styles.topupContentTotalPrice}>
              USDC Balance: {balance} USDC
            </p>
          </div>
        </>
      )}

      <Modal
        title={`Withdraw Funds`}
        className="c-add-compute__modal"
        open={isOpenWithdraw}
        onCancel={onCancelModal}
      >
        <WithdrawForm setLoading={setLoading} onClose={onCancelModal} />
      </Modal>
    </AdminLayout>
  );
};

export default CryptoPayment;
