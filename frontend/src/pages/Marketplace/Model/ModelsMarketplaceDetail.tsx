import ModelDetail from "@/components/ModelMarketplace/ModelDetail/Index";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export default function ModelsMarketplaceDetail() {
  const navigate = useNavigate();

  const onBack = useCallback(() => {
    navigate("/marketplace/models");
  }, [navigate]);

  const onCompleted = useCallback(() => {}, []);

  return (
    <ModelDetail
      onBackClick={onBack}
      onCompleted={onCompleted}
      autoCreateProject={true}
    />
  )
}
