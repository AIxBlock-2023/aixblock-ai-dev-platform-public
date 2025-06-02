import React, { CSSProperties, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconArrowLeft } from "@/assets/icons/Index";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import "./Select.scss";
import ListOptions from "./SelectContent/SelectContent";
import Spin from "../Spin/Spin";
import {highestZIndex} from "@/utils/zIndex";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
  data?: any;
};

export type DataSelect = {
  label?: string | undefined;
  options: SelectOption[];
  //apply one level group
  value?: string;
  data?: any | undefined;
};

export type TSelectProps = {
  placeholderText?: string;
  className?: string;
  classNameWidth?: string;
  defaultValue?: SelectOption | SelectOption[] | null;
  label?: string;
  data: DataSelect[];
  status?: "" | "error" | "warning" | "success";
  withContent?: string;
  disabled?: boolean;
  isCreatePortal?: boolean; // use with component dropdown => value is false
  iconWithLabel?: React.ReactNode;
  onChange?: (e: SelectOption) => void;
  isMultiple?: boolean;
  onMultipleChange?: (e: SelectOption[]) => void;
  labelClass?: string;
  isSelectGroup?: boolean;
  isLoading?: boolean;
	error?: string | null;
	type?: 'checkbox' | 'selectbox',
	customRenderLabel?: (item: SelectOption) => ReactElement,
  onClickOutside?: () => void;
  isRequired?: boolean;
  canFilter?: boolean;
  limitHeight?: boolean;
};

const Select: React.FC<TSelectProps> = (props) => {
  const {
    placeholderText,
    className,
    defaultValue,
    label,
    data,
    status = "",
    withContent,
    disabled,
    isCreatePortal = true,
    iconWithLabel = <IconArrowLeft />,
    isMultiple,
    onMultipleChange,
    onChange,
    labelClass,
    isSelectGroup,
    isLoading,
    error,
		classNameWidth,
		type = 'selectbox',
		customRenderLabel,
    onClickOutside,
    isRequired,
    limitHeight,
  } = props;

  const selectRef = useRef<HTMLDivElement | null>(null);
  const slRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  const [isShowListOption, setShowListOption] = useState<boolean>(false);
  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>(
    defaultValue
      ? Array.isArray(defaultValue)
        ? defaultValue
        : [defaultValue]
      : []
  );
  const [style, setStyle] = useState<CSSProperties>({
    top: 0,
    left: 0,
    width: 0,
    zIndex: 0,
  });
  const hasData = data && data.length > 0;
  // const zIndex = useRef(highestZIndex() + 1);
  // const MAX_HEIGHT = 400;

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(e.target as Node) &&
        slRef.current &&
        !slRef.current.contains(e.target as Node)
      ) {
        setShowListOption(false);
        onClickOutside?.();
      }
    },
    [selectRef, slRef, onClickOutside]
  );

  const handleOpenSelect = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.stopPropagation();
    setShowListOption((prev) => !prev);
  };

  const handleSelectOption = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    val: SelectOption
  ) => {
    e.stopPropagation();
    if(type === 'selectbox') setShowListOption((prev) => !prev);

    if (isMultiple) {
      let newOptions;

      if (selectedOptions.find((o) => o.value === val.value)) {
        newOptions = selectedOptions.filter((o) => o.value !== val.value);
      } else {
        newOptions = [...selectedOptions, val];
      }

      setSelectedOptions(newOptions.filter((f) => f.value));
      onMultipleChange?.(newOptions.filter((f) => f.value));
    } else {
      setSelectedOptions([val]);
      onChange?.(val);
    }
  };

  useEffect(() => {
    setSelectedOptions(
      defaultValue
        ? Array.isArray(defaultValue)
          ? defaultValue
          : [defaultValue]
        : []
    );
  }, [defaultValue, label]);

  useEffect(() => {
    if (!isShowListOption || isLoading) {
      setStyle({
        top: -10000,
        left: -10000,
      });

      return;
    }

    if (selectRef.current && isShowListOption) {
      const sList = slRef.current;

      if (sList && slRef.current) {
        const wrapperRect = selectRef.current.getBoundingClientRect();
        let top = wrapperRect.top + window.scrollY + selectRef.current.clientHeight + 10;
        let left = wrapperRect.left;
        let width = withContent ? parseInt(withContent) : Math.min(slRef.current.getBoundingClientRect().width, 400);
        let height = undefined;

        if (left + width > window.innerWidth) {
          left = window.innerWidth - width - 8;
        }

        if (!withContent && selectRef.current.getBoundingClientRect().width > width) {
          width = selectRef.current.getBoundingClientRect().width;
        }

        if (limitHeight) {
          const maxHeight = window.innerHeight - top;

          if (slRef.current.clientHeight > maxHeight - 10) {
            height = maxHeight - 10;
          }
        }

        setHeight(slRef.current.clientHeight);

        setStyle({
          top,
          left,
          width,
          height,
          zIndex: highestZIndex() + 1,
        });
      }
    }
  }, [isShowListOption, withContent, isLoading, limitHeight]);

  useOnClickOutside(slRef, handleClickOutside);

  const maxHeight = useMemo(() => {
    if (!style.top) {
      return window.innerHeight;
    }

    return Math.min(400, window.innerHeight - Number(style.top));
  }, [style.top]);

  return (
    <>
      <div
        className={`c-select ${className ? className : null} ${
          disabled ? "disabled" : ""
        } type-${type} ${selectedOptions.length > 0 ? "has-value" : ""}`}
        ref={selectRef}
        onClick={(e) => handleOpenSelect(e)}
      >
        {label && (
          <label className={labelClass ? labelClass : "c-select__label"}>
            {label}
            {isRequired && <> <span className="required">*</span></>}
          </label>
        )}
        <div
          className={`c-select__content ${status} ${
            isShowListOption ? "active" : ""
          } ${error ? "c-select__content--error" : ""}`}
        >
          <div className="c-select--action">
            {isLoading && <Spin loading={isLoading} />}
            {!hasData ? (
              <div>{placeholderText}</div>
            ) : (
              <>
                <label className="c-select__placeholder">
                  {selectedOptions.length > 0
                    ? selectedOptions.map((opt, idx) => isMultiple? <span key={`key-${idx}-${opt.value}`}>{opt.label}</span> : opt.label)
                    : placeholderText}
                </label>
                {iconWithLabel}
              </>
            )}
          </div>
        </div>
        {error && error.length > 0 && (
          <div className="c-select__error">{error}</div>
        )}
      </div>
      {
        isCreatePortal ? (
          createPortal(
            hasData ? (
              <ListOptions
                className={`${
                  height >= maxHeight - 10
                    ? "scrollbar select-scroll"
                    : "c-select__list-content"
                } ${className ? className : ""}`}
                style={style}
                slRef={slRef}
                data={data}
                onChange={handleSelectOption}
                selectedOptions={selectedOptions}
                isSelectGroup={isSelectGroup}
								classNameWidth={classNameWidth}
								type={type}
								customRenderLabel={customRenderLabel}
                canFilter={props.canFilter}
              />
            ) : (
              <div className="c-select__list-content">{placeholderText}</div>
            ),
            document.body
          )
        ) : (
          <ListOptions
            className={`${
              height >= maxHeight - 10
                ? "scrollbar select-scroll"
                : "c-select__list-content"
            } ${className ? className : ""}`}
            style={style}
            slRef={slRef}
            data={data}
            isCreatePortal
            onChange={handleSelectOption}
            selectedOptions={selectedOptions}
            isSelectGroup={isSelectGroup}
						classNameWidth={classNameWidth}
						type={type}
						customRenderLabel={customRenderLabel}
            canFilter={props.canFilter}
          />
        )
      }
    </>
  );
};

export default Select;
