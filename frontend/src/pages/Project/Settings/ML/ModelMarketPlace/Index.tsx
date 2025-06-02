import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Pagination from "@/components/Pagination/Pagination";
import /*Select,*/ {DataSelect, SelectOption} from "@/components/Select/Select";
import { useGetListModel } from "@/hooks/settings/ml/useGetListModel";
import { useUserLayout } from "@/layouts/UserLayout";
import { useBooleanLoader } from "@/providers/LoaderProvider";
// import LayoutSettings from "../../LayoutSettings/Index";
import "./Index.scss";
import ModelItem from "./ModelItem/Index";
import { IconCirclePlus, IconClose } from "@/assets/icons/Index";
import { createAlert } from "@/utils/createAlert";
import InputBase from "@/components/InputBase/InputBase";
// import { useGetListCatalog } from "@/hooks/computes/useGetListCatalog";

const SORT_OPTIONS: DataSelect[] = [
  {
    label: "",
    options: [
      { label: "Default order", value: "" },
      { label: "Type ASC", value: "type-asc" },
      { label: "Type DESC", value: "type-desc" },
      { label: "Price ASC", value: "price-asc" },
      { label: "Price DESC", value: "price-desc" },
      { label: "Like ASC", value: "like-asc" },
      { label: "Like DESC", value: "like-desc" },
      { label: "Download ASC", value: "download-asc" },
      { label: "Download DESC", value: "download-desc" },
    ],
  },
];

const MLModelMarketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = searchParams.get("page");
  const params = useParams();
  const projectId = parseInt(params.projectID ?? "0");
  const [sort, setSort] = useState<null | SelectOption>(
    SORT_OPTIONS[0].options.find(o => o.value === searchParams.get("sort")) ?? null
  );
  // const [catalogId, setCatalogId] = useState<{
  //   label: string;
  //   value: string;
  // } | null>(null);
  const [searchName, setSearchName] = useState<string | null>(searchParams.get("name"));

  // const { listData: listCatalog, loading: loadingListCatalog } = useGetListCatalog({ type: "model" });

  const userLayout = useUserLayout();
  const navigate = useNavigate();

  const {
    listData,
    fetchData: reFetch,
    loading,
    page,
    pageSize,
    setPage,
    error,
  } = useGetListModel({
    page: currentPage ? Number(currentPage) : 1,
    pageSize: 12,
    ...sort ? {sort: sort.value} : {},
    ...searchName ? {name: searchName} : {},
    project_id: projectId.toString()
  });

  useBooleanLoader(loading, "Loading models marketplace...");

  // const modelCatalogList = useMemo(() => {
  //   let results: DataSelect[] = [];
  //   if (listCatalog) {
  //     results = [
  //       {
  //         label: "",
  //         options: [
  //           { label: "Any catalog", value: "" },
  //           ...listCatalog.map((item) => ({
  //             label: item.name,
  //             value: item.id?.toString(),
  //           }))
  //         ],
  //       },
  //     ];
  //   }
  //   return results;
  // }, [listCatalog]);

  // const onSort = (val: any) => {
  //   searchParams.set("sort", val.value);
  //   setSort(val);
  //   setSearchParams(searchParams);
  // };

  // const onCatalogChange = (
  //   val: {
  //     label: string;
  //     value: string;
  //   } | null
  // ) => {
  //   if (val) {
  //     setCatalogId(val);
  //     searchParams.set("catalog_id", val.value);
  //     setSearchParams(searchParams);
  //   }
  // };

  const onClearFilter = () => {
    setSearchParams((prevSearchParams) => {
      const newSearchParams = new URLSearchParams(prevSearchParams);
      newSearchParams.delete("sort");
      newSearchParams.delete("name");
      return newSearchParams;
    });
    setSort(null);
    setSearchName(null);
  };

  useEffect(() => {
    userLayout.setActions([
      {
        icon: <IconCirclePlus />,
        actionType: "danger",
        label: "Cancel",
        onClick: () => navigate(`/dashboard/`),
      },
    ]);
    return () => {
      userLayout.clearActions();
    };
  }, [userLayout, projectId, navigate]);

  const errorNode = useMemo(() => {
    return createAlert(error, reFetch);
  }, [error, reFetch]);

  useEffect(() => {
    reFetch();
  }, [sort, searchName, reFetch]);

  return (
    // <LayoutSettings.Container>
    //   <LayoutSettings.Header />
      <div className="p-ml-marketplace m-303">
        <div className="p-ml-marketplace__breadcrumb">
          <h4 className="p-ml-marketplace__title">
            <strong>Marketplace</strong> ({listData?.count} model{(listData?.count ?? 0) > 1 ? "s" : ""})
          </h4>
          <div className="p-ml-marketplace__actions">
            {/*<Select
              data={modelCatalogList}
              className="p-ml-marketplace__catalog"
              isLoading={loadingListCatalog}
              onChange={(val) => onCatalogChange(val)}
              defaultValue={
                catalogId
                  ? { label: catalogId.label, value: catalogId.value }
                  : { label: "Any catalog", value: "" }
              }
            />*/}
            <InputBase
              placeholder={"Enter model name"}
              style={{ minWidth: 256 }}
              value={searchName ?? ""}
              onKeyUp={e => {
                e.preventDefault();

                if (e.key !== "Enter") {
                  return;
                }

                setSearchName(e.currentTarget.value);
                searchParams.set("name", e.currentTarget.value);
                setSearchParams(searchParams);
              }}
            />
            {/* <Select
              className="p-ml-marketplace__filters"
              data={SORT_OPTIONS}
              onChange={(val) => {
                onSort(val);
              }}
              defaultValue={sort ?? SORT_OPTIONS[0].options[0]}
            /> */}
            {((sort && sort.value !== SORT_OPTIONS[0].options[0].value) || searchName) && (
              <button
                className="p-ml-marketplace__clear"
                onClick={() => onClearFilter()}
              >
                <IconClose />
              </button>
            )}
          </div>
        </div>
        {errorNode}
        <div className="p-ml-marketplace__list">
          {listData?.results?.map((item) => (
            <ModelItem
              key={`key-${item.id}`}
              item={item}
              onClick={() =>
                navigate(`/marketplace/models/${projectId}/detail`, {
                  state: {
                    item: item,
                  },
                })
              }
            />
          ))}
        </div>
        {listData && listData?.results.length > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={listData?.count ?? 1}
            setPage={(val) => {
              setPage(val);
              reFetch();
            }}
            target={`marketplace/models/${projectId}`}
          />
        )}
      </div>
      // <LayoutSettings.Footer
      //   prevUrl={"/projects/" + projectId + `/settings/general`}
      //   nextUrl={"/projects/" + projectId + `/settings/webhooks`}
      // />
    // </LayoutSettings.Container>
  );
};

export default MLModelMarketplace;
