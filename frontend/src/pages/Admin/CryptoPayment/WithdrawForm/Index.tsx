import React, { memo, useState } from "react";
import IconPlus from "@/assets/icons/IconPlus";
import Button from "@/components/Button/Button";
import InputBase from "@/components/InputBase/InputBase";
import { useApi } from "@/providers/ApiProvider";
import { confirmDialog } from "@/components/Dialog";
import { toastError, toastSuccess } from "@/utils/toast";
import { isValidSolanaAddress } from "@/utils/validators";

type TAddOrgFormProps = {
  setLoading: (boolean: boolean) => void;
  onClose: () => void;
};

const MemoizedWithdrawForm = (props: TAddOrgFormProps) => {
  const api = useApi();
  const { onClose, setLoading } = props;

  const [solanaAddress, setSolanaAddress] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent button click from submitting form

    confirmDialog({
      message: "Are you sure you want to withdraw?",
      onSubmit: async () => {
        try {
          setLoading(true);

          if (!solanaAddress) {
            toastError("Please input Solana Address");
            return;
          }
          if (!isValidSolanaAddress(solanaAddress)) {
            console.log("Invalid Solana Address");
            toastError("Invalid Solana Address");
            return;
          }
          const ar = api.call("adminWithdrawCrypto", {
            method: "POST",
            body: {
              walletAddress: solanaAddress,
            },
          });
          const data = await ar.promise;
          if (data.ok) {
            toastSuccess("Withdraw success");
            setSolanaAddress("");
          }
        } catch (error) {
          console.log(error);
        }
        onClose();
        setLoading(false);
      },
    });
  };

  return (
    <div className="c-org-form">
      <form onSubmit={onSubmit}>
        {" "}
        {/* Prevent form submission */}
        <div className="c-org-form__content">
          <div className="c-org-form__top">
            <InputBase
              className="c-org-form__input"
              label="Solana wallet is case sensitive. Please input the correct wallet
            address."
              placeholder="Input Solana Address"
              onChange={(e) => setSolanaAddress(e.target.value)}
            />
          </div>
        </div>
        <div className="c-org-form__action">
          <Button
            htmlType="submit"
            className="c-org-form__action--add"
            icon={<IconPlus />}
          >
            Withdraw funds
          </Button>
        </div>
      </form>
    </div>
  );
};

const WithdrawForm = memo(MemoizedWithdrawForm);

export default WithdrawForm;
