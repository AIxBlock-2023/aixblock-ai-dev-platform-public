import { default as BaseMarketplace } from "@/components/ModelMarketplace/Index";
import { useCallback } from "react";
import { TModelMarketplace } from "@/models/modelMarketplace";
import styles from "./ModelsMarketplace.module.scss";
import { useNavigate } from "react-router-dom";

export default function ModelsMarketplace() {
  const navigate = useNavigate();
  
  const onDetailClick = useCallback((item: TModelMarketplace) => {
    navigate("/marketplace/models/" + item.id);
  }, [navigate]);

  return (
    <div className={styles.container}>
      <BaseMarketplace
        pageUrl="/marketplace/models"
        onDetailClick={onDetailClick}
        tasksFilter={true}
      />
    </div>
  );
}
