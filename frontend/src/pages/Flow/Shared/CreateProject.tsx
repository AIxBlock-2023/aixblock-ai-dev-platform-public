import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button/Button";
import EmptyContent from "@/components/EmptyContent/EmptyContent";
import InputBase from "@/components/InputBase/InputBase";
import Select, { SelectOption } from "@/components/Select/Select";
import { useGetDataTemplatesGpu } from "@/hooks/settings/general/useGetDataTemplatesGpu";
import { TProjectModel } from "@/models/project";
import { createAlert } from "@/utils/createAlert";
import { COLOR_LIST, GENERAL_ENUM } from "../../Project/Settings/LayoutSettings/constants";
import styles from "./CreateProject.module.scss";

export type TProps = {
  project: TProjectModel | null;
  generalData: Partial<TProjectModel>;
  error: string | null;
  loading: boolean;
  validationErrors: {
    [k: string]: string[];
  }
  setGeneralData: Dispatch<SetStateAction<Partial<TProjectModel>>>;
}

export default function CreateProject(props: TProps) {
  const navigate = useNavigate();
  const {
    project,
    generalData,
    error,
    loading,
    validationErrors,
    setGeneralData,
  } = props;

  const {
    templates: apiTemplates,
    loading: loadingTemplates,
    configList,
    error: loadingError,
    refresh: refreshAnnotation,
  } = useGetDataTemplatesGpu();

  const isMCE = useMemo(() => (project?.label_config ?? "").startsWith('<View id="llm-custom"'), [project?.label_config]);

  const errorNode = useMemo(() => {
    return createAlert(error, undefined, false);
  }, [error]);

  const templates = useMemo(() => {
    return apiTemplates.concat([
      // { label: "Multimodal Custom Editor", value: "llm_custom", options: [] },
    ]);
  }, [apiTemplates]);

  const getLabelSelected = useMemo(() => {
    let val: SelectOption | null = null;
    templates.forEach((category) => {
      let selected = category.options.find(
        (option) => option.value === generalData.type?.value
      );
      if (!selected)
        selected =
          category.value === generalData.type?.value
            ? {
              label: category.label ?? "",
              value: category.value ?? "",
              data: category.data,
            }
            : undefined;

      if (selected) {
        val = { label: selected.label ?? "", value: selected.value ?? "" };
      }
    });
    return val;
  }, [templates, generalData.type?.value]);

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      if (field === "type") {
        if (value === "llm_custom") {
          setGeneralData((ps) => ({
            ...ps,
            label_config: '<View id="llm-custom"><!----></View>',
            annotation_template: 0,
            type: { label: value, value: value },
          }));
        } else {
          const template_id = parseInt(value);
          let template_name = "";

          templates.forEach(tg => {
            tg.options.forEach(t => {
              if (t.value !== value) {
                return;
              }

              template_name = t.label;
            })
          });

          setGeneralData((ps) => ({
            ...ps,
            label_config: configList[template_id],
            annotation_template: template_id,
            label_config_title: template_name,
            template_id,
            type: {
              label: value,
              value: value,
            },
          }));
        }
      } else {
        setGeneralData((ps) => ({ ...ps, [field]: value }));
      }
    },
    [configList, templates, setGeneralData]
  );

  if (loadingError) {
    return <div className="c-general loading-error">
      <EmptyContent message={loadingError} buttons={[
        {
          children: "Retry",
          type: "hot",
          onClick: () => refreshAnnotation(),
        }
      ]} />
    </div>
  }

  return (
    <div className={styles.createProject}>
      <div className={styles.errorNode}>
        {errorNode}
      </div>
      <h4 className={styles.heading}>General</h4>
      <div className={styles.section}>
        <div className={styles.sectionItem}>
          <InputBase
            key={`key-input-${project?.title}`}
            className={styles.field}
            label="Project name"
            placeholder="Type something"
            disabled={loading}
            onChange={(e) =>
              handleFieldChange(GENERAL_ENUM.title, e.target.value)
            }
            allowClear={false}
            value={project?.title ?? ""}
            error={
              Object.hasOwn(validationErrors, "title")
                ? validationErrors["title"][0]
                : null
            }
          />
          {!project?.id && (
            <Select
              key={`key-select-${project?.sampling}`}
              label="Types ( * )"
              data={templates}
              onChange={(value) =>
                handleFieldChange(GENERAL_ENUM.type, value.value)
              }
              isSelectGroup
              isLoading={loadingTemplates}
              defaultValue={
                getLabelSelected ?? { label: "Select type", value: "" }
              }
              error={
                Object.hasOwn(validationErrors, "label_config")
                  ? validationErrors["label_config"][0]
                  : null
              }
              limitHeight={true}
            />
          )}
          {isMCE && (
            <Button
              type="gradient"
              size="small"
              onClick={() => {
                navigate("/projects/" + (project?.id ?? "0") + "/editor-designer")
              }}
              style={{
                minWidth: "auto",
                transform: "translateY(22px)",
                width: 210,
              }}
            >
              Design Editor UI
            </Button>
          )}
        </div>
      </div>
      <div className={styles.sectionFlex}>
        <label className={styles.radioLabel}>Color</label>
        <div className={styles.radioList}>
          {COLOR_LIST?.map((item) => (
            <div
              className={`${styles.radioItem} ${item.name}`}
              key={`key-color-${item.name}`}
            >
              <input
                key={`key-color-${project?.color}`}
                type="radio"
                id={item.color}
                name={item.name}
                value={item.value}
                checked={(generalData?.color || project?.color) === item.value}
                onChange={(e) =>
                  handleFieldChange(GENERAL_ENUM.color, e.target.value)
                }
              />
              <span
                className={styles.radioCheckmark}
                style={{ background: item.color }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
