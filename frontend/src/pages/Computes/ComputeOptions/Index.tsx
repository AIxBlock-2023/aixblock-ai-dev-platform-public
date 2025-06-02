import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TButtonProps } from "@/components/Button/Button";
import Option from "../Option/Index";
import "./Index.scss";
import { useUserLayout } from "@/layouts/UserLayout";
import IconClearCircle from "@/assets/icons/IconClearCircle";
import IconBook from "@/assets/icons/IconBook";

const options = [
  // {
  //   id: 1,
  //   title: "Use our infrastructure (Model Training, cloud storage)",
  //   subTitle:
  //     "Should you not possess personal computational resources, our facilities are at your disposal.",
  //   buttonText: "Start Now",
  //   type: "white",
  //   routePath: "/computes/default",
  // },
  {
    id: 2,
    title: "Bring your own computes",
    subTitle:
      "Add your own compute resources here, and whenever you need more, you can easily rent additional resources from the marketplace.",
    buttonText: "Start Now",
    type: "primary",
    routePath: "/computes/add-host",
  },
  {
    id: 3,
    title: "Rent compute from decentralized marketplace",
    subTitle:
      "Access affordable, decentralized computing power with no setup or vendor lock-in, secured by blockchain technology.",
    buttonText: "Start Now",
    type: "primary",
    routePath: "/marketplace/computes",
  },
];

const ComputeOptions = () => {
  const [active, setOptActive] = useState<number | null>(2);
  const navigate = useNavigate();
  const userLayout = useUserLayout();

  useEffect(() => {
    userLayout.setBreadcrumbs([
      { label: "Which option do you want?" },
    ]);
    userLayout.setActions([
      {
        icon: <IconBook />,
        label: "Tutorial",
        onClick: () => navigate("/document/"),
        actionType: "outline",
        class: "btn-tutorial"
      },
      {
        icon: <IconClearCircle />,
        label: "Cancel",
        onClick: () => navigate("/computes/"),
        actionType: "danger",
      },
    ]);
    return () => {
      userLayout.clearBreadcrumbs();
      userLayout.clearActions();
    };
  }, [userLayout, navigate]);

  const onSelectOpt = (val: number) => {
    setOptActive(val);
  };

  const onPressStartNow = (routePath: string) => {
    navigate(routePath);
  };

  return (
    <div className="p-compute-opt">
      <div className="p-compute-opt__heading">
        <h2>Which option do you want?</h2>
      </div>
      <div className="p-compute-opt__content">
        {(options ?? []).map((opt) => (
          <div
            className={`p-compute-opt__item-wrapper ${
              active === opt.id ? "active" : ""
            }`}
            key={`key-opt-${opt.id}`}
            onClick={() => onSelectOpt(opt.id)}
          >
            <Option
              title={opt.title}
              subTitle={opt.subTitle}
              checked={active === opt.id}
              buttonText={opt.buttonText}
              type={opt.type as TButtonProps["type"]}
              onPress={() => onPressStartNow(opt.routePath)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComputeOptions;
