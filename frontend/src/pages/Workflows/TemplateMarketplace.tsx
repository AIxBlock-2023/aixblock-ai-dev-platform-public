import styles from "./TemplateMarketplace.module.scss";
import Select from "@/components/Select/Select";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import Pagination from "@/components/Pagination/Pagination";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InputBase from "@/components/InputBase/InputBase";
import { useNavigate, useSearchParams } from "react-router-dom";
import TemplateItem from "@/pages/Workflows/TemplateItem";
import useWorkflowTemplatesHook from "@/hooks/workflow/useWorkflowTemplatesHook";
import { TWorkflowTemplateModel } from "@/models/workflowTemplate";

const CATEGORIES = [
  {
    options: [
      {label: "Category 1", value: "1"},
      {label: "Category 2", value: "2"},
      {label: "Category 3", value: "3"},
    ],
  },
];

export default function TemplateMarketplace() {
  const searchNameRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const keywordTimeoutRef = useRef<NodeJS.Timeout>();
  const [searchName, setSearchName] = useState<string | null>(searchParams.get("name"));
  const [searchCategory, setSearchCategory] = useState<string | null>(searchParams.get("category"));
  const navigate = useNavigate();
  const {page, setPage, list, loading, total, refresh, loadingError} = useWorkflowTemplatesHook();

  const searchNameInput = useMemo(() => (
    <InputBase
      outsideRef={searchNameRef}
      key="search-name"
      placeholder={"Enter template name"}
      style={{minWidth: 256}}
      value={searchParams.get("name") ?? ""}
      isDefaultValue={true}
      allowClear={false}
      onKeyUp={e => {
        e.preventDefault();

        if (e.key !== "Enter") {
          return;
        }

        clearTimeout(keywordTimeoutRef.current);
        setSearchName(e.currentTarget.value);
      }}
      onChange={e => {
        clearTimeout(keywordTimeoutRef.current);

        keywordTimeoutRef.current = setTimeout(() => {
          setSearchName(e.target.value);
        }, 1000);
      }}
    />
    // eslint-disable-next-line
  ), []);

  const onDetailClick = useCallback((item: TWorkflowTemplateModel) => {
    navigate("/template-marketplace/" + item.id);
  }, [navigate]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();

    if (searchName) {
      newSearchParams.set("name", searchName);
    }

    if (searchCategory) {
      newSearchParams.set("category", searchCategory);
    }

    if (page > 1) {
      newSearchParams.set("page", page.toString());
    }

    setSearchParams(newSearchParams);
  }, [setSearchParams, searchName, searchCategory, page]);

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <h4 className={styles.title}>
          <strong>Marketplace</strong> ({list.length} template{list.length > 1 ? "s" : ""})
        </h4>
        <div className={styles.actions}>
          {searchNameInput}
          <Select
            className={styles.taskList}
            isLoading={false}
            error={undefined}
            data={CATEGORIES}
            defaultValue={CATEGORIES[0]["options"].find(o => o.value === searchCategory)}
            canFilter={true}
            withContent="300"
            onChange={o => {
              setSearchCategory(o.value);
            }}
          />
        </div>
      </div>
      {
        loading
          ? <EmptyContent message="Loading templates..." />
          : (
            loadingError
              ? <EmptyContent message={loadingError} />
              : (
                list.length > 0
                  ? (
                    <>
                      <div className={styles.list}>
                        {list.map((item) => (
                          <TemplateItem
                            item={item}
                            onClick={onDetailClick}
                            noPrice={item.price === 0}
                          />
                        ))}
                      </div>
                      <Pagination
                        page={page}
                        pageSize={10}
                        total={total ?? 1}
                        setPage={(val) => {
                          setPage(val);
                          refresh();
                        }}
                        target={"/template-marketplace"}
                      />
                    </>
                  )
                  : !loading && <EmptyContent message="(no template found)" />
              )
          )
      }
    </div>
  );
}
