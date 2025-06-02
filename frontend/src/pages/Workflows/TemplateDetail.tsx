import { useNavigate, useParams } from "react-router-dom";
import Deposit from "@/pages/ComputesMarketplace/Deposit/Deposit";
import { useCallback } from "react";
import { infoDialog } from "@/components/Dialog";

export default function TemplateDetail() {
  const {id} = useParams();
  const navigate = useNavigate();

  const handleRent = useCallback(() => {
    infoDialog({
      title: "Processing...",
      message: "Your transaction will be processed after the developer implements the code.",
    });

    navigate("/template-marketplace");
  }, [navigate]);

  return (
    <div>
      <Deposit
        priceDetailGPU={Math.random() * 30}
        onHandleRent={handleRent}
        customTitle={`${id} - Wordpress from Youtube Template`}
        customNote={"This automated workflow enables seamless publishing of WordPress articles based " +
          "on new videos uploaded to a YouTube channel. It handles the entire process, from extracting " +
          "video details to publishing a formatted article, including the automatic creation of " +
          "categories, tags, and thumbnail images."}
      />
    </div>
  );
}
