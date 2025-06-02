import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Pagination from "@/components/Pagination/Pagination";
import Select from "@/components/Select/Select";
import { useGetListModel } from "@/hooks/settings/ml/useGetListModel";
import { useUpdateModelMarketplace } from "@/hooks/settings/ml/useUpdateModelMarketplace";
import { useAuth } from "@/providers/AuthProvider";
import {useBooleanLoader, usePromiseLoader} from "@/providers/LoaderProvider";
import "./Index.scss";
import ModelItem from "./Model/Model";
import SidebarMarketplace from "./Sidebar/Index";
import {confirmDialog, infoDialog} from "@/components/Dialog";
import {openNewTab} from "@/utils/openNewTab";

const FILTER_OPTIONS = [
  {
    label: "",
    options: [
      { label: "Type", value: "type" },
      { label: "Price", value: "price" },
      { label: "Hottest", value: "hottest" },
    ],
  },
];

const SORT_OPTIONS = [
  {
    label: "",
    options: [
      { label: "DESC", value: "desc" },
      { label: "ASC", value: "asc" },
    ],
  },
];

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = searchParams.get("page");
  const params = useParams();
  const projectID = parseInt(params.projectID ?? "0");
  const [filter, setFilter] = React.useState<any>({});
  const [sort, setSort] = React.useState<null | string>(searchParams.get('sort'));
  const [catalogId, setCatalogId] = React.useState<null | string>(searchParams.get('catalogId'));
  const [type, setType] = React.useState<null | string>(searchParams.get('type'));
  const [sortField, setSortField] = React.useState<null | string>(FILTER_OPTIONS[0].options[0].value);
  const [search, setSearch] = React.useState<string | null>(searchParams.get('search'));
  const [fieldSearch, setFieldSearch] = React.useState<string | null>(searchParams.get('fieldSearch'));
  const { user } = useAuth();
  const { onUpdate } = useUpdateModelMarketplace();
  const { addPromise } = usePromiseLoader();
  const navigate = useNavigate();

  const {
    listData,
    fetchData: reFetch,
    loading,
    page,
    pageSize,
    setPage,
  } = useGetListModel({
    page: currentPage ? Number(currentPage) : 1,
    fieldSearch: fieldSearch ,
    search: search,
    sort: sort,
    catalogId: catalogId,
    type: type,
    project_id: projectID.toString()
  });
  useBooleanLoader(loading, "Loading models...");
  async function buyModel(id: number, ip_address: string, port: string) {
    try {
      // Check computes availablity
      // @TODO: Call API to check
      let checkResult = false;

      if (!checkResult) {
        confirmDialog({
          title: "Insufficient Computing Resources",
          message:
            "Your computing resources are insufficient to meet current demands. " +
            "Would you like to purchase additional computing resources?",
          submitText: "Go to marketplace",
          onSubmit: () =>
            openNewTab(window.APP_SETTINGS.hostname + "marketplace/computes/"),
        });

        return;
      }

      /* eslint-disable */
      const ar = onUpdate(
        {
          author_id: user?.id ?? 1,
          is_buy_least: true,
          project_id: projectID,
        },
        id
      );
      addPromise(ar.promise, "Processing...");
      const res = await ar.promise;

      if (!res.ok) {
        const data = await res.json();

        if (Object.hasOwn(data, "detail")) {
          infoDialog({message: "Server error: " + data["detail"]});
        } else {
          infoDialog({message: "An error ocurred while buying model (" + res.statusText + "). Please try again!"});
        }

        return;
      }
      /* eslint-enable */

      // const ar2 = onCreateMl(projectID, ip_address, port);
      // addPromise(ar2.promise, "Creating backend...")
      // const res2 = await ar2.promise;

      // if (!res2.ok) {
      //   const data2 = await res2.json();

      //   if (Object.hasOwn(data2, "detail")) {
      //     infoDialog({message: "Server error: " + data2["detail"]});
      //   } else {
      //     infoDialog({message: "An error ocurred while buying model (" + res2.statusText + "). Please try again!"});
      //   }

      //   return;
      // }

      navigate("/projects/" + projectID + "/settings/ml");
    } catch (error) {
      if (error instanceof Error) {
        infoDialog({message: error.message});
      } else {
        infoDialog({message: "An error occurred while renting model. Please try again!"});
      }
    }
  }

  function onSort(val: any) {
    searchParams.set('sort', sortField+'-'+val.value);
    setSort(sortField+'-'+val.value )
    setSearchParams(searchParams);
  }

  function clearFilter(){
    setSearchParams((prevSearchParams) => {
      const newSearchParams = new URLSearchParams(prevSearchParams);
      newSearchParams.set('sort', '');
      newSearchParams.set('catalogId', '');
      newSearchParams.set('search', '');
      newSearchParams.set('type', '');
      return newSearchParams;
    });
    setSort(null)
    setCatalogId(null)
    setSearch(null)
    setType(null)
  }

  return (
    <div className="p-marketplace">
      <SidebarMarketplace
        onSearchFilter={(val) => {
          searchParams.set('fieldSearch',Object.keys(val)[0] )
          searchParams.set('search', Object.values(val)[0] as string )
          setSearchParams(searchParams);
          setFieldSearch(Object.keys(val)[0]);
          setSearch(Object.values(val)[0] as string);
          reFetch()
        }}
        onCatalogFilter={(val) => {
          searchParams.set('catalogId', val.catalog_id.toString() )
          setSearchParams(searchParams);
          setCatalogId(val.catalog_id.toString());
          setFilter({ ...filter, ...val });
          reFetch();
        }}
       
        onClearFilter={(val) => {
          clearFilter()
          reFetch();
        }}
      />
      <div className="p-marketplace__content">
        <div className="p-marketplace__breadcrumb">
          <Select
            className="p-marketplace__filters custom-filter"
            data={FILTER_OPTIONS}
            onChange={(val)=> {
               setSortField(val.value)
            }}
            defaultValue={{ label: "Filter", value: "" }}
          />
          <Select
            className="p-marketplace__filters custom-filter"
            data={SORT_OPTIONS}
            onChange={onSort}
            defaultValue={{ label: "Sort", value: "" }}
          />
        </div>
        <div className="p-marketplace__list">
          {listData?.results?.map((item) => (
            <ModelItem
              key={`key-${item.id}`}
              item={{
                downloaded: item.download_count,
                price: /*item.type === "MODEL-SYSTEM" ? "Free" :*/ item.price,
                mlTitle: item.name,
                mlDesc: item.model_desc,
                updateAt: item.updated_at,
                reactHeart: item.like_count,
                isFree: /*item.type === "MODEL-SYSTEM"*/ item.price <= 0,
              }}
              onClick={() =>
                buyModel(item.id, item.ip_address ?? "", item.port ?? "")
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
            target="models-marketplace"
          />
        )}
      </div>
    </div>
  );
};

export default Marketplace;
