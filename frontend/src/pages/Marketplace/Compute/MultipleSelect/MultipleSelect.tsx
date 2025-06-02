import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import './MultipleSelect.scss'
import Checkbox from '../../../../components/Checkbox/Checkbox';
import InputBase from '../../../../components/InputBase/InputBase';
import IconArrowLeft from '../../../../assets/icons/IconArrowLeft';
import useOnClickOutside from '../../../../hooks/useOnClickOutside';
import {TComputeMarketplaceV2SelectedOption} from "../types";

interface TProps {
  id: string,
  options: TComputeMarketplaceV2SelectedOption[];
  label: string;
  num_gpus: number;
  onHandleSelect: (selectedOptions: TComputeMarketplaceV2SelectedOption[]) => void;
}

export default function CheckboxSelect({ options = [], label, num_gpus, onHandleSelect = () => void 0, id}: TProps) {
  const [selectedOptions, setSelectedOptions] = useState<TComputeMarketplaceV2SelectedOption[]>([]);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [active, setActive] = useState(false);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});
  const refOptions = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        refOptions.current &&
        !refOptions.current.contains(e.target as Node)
      ) {
        setActive(false);
      }
    },
    [refOptions]
  );

  useOnClickOutside(refOptions, handleClickOutside);

  useEffect(() => {
    onHandleSelect(selectedOptions);
  }, [selectedOptions, onHandleSelect]);

  useEffect(() => {
    const initialQuantities: { [key: string]: number } = {};
    options.forEach(option => {
      if (option.id) {
        initialQuantities[option.id] = option.quantity || 0;
      }
    });
    setQuantities(initialQuantities);
  }, [options]);

  const toggleOption = (option: TComputeMarketplaceV2SelectedOption) => {
    if (isSelected(option)) {
      setSelectedOptions(prevSelectedOptions =>
        prevSelectedOptions.filter(item => item.id !== option.id)
      );
    } else {
      const updatedOption = {
        ...option,
        totalPrice: option.price * (quantities[option.id] || 0),
        quantity: quantities[option.id] || 1
      };
      setSelectedOptions(prevSelectedOptions => [...prevSelectedOptions, updatedOption]);
    }
  };

  const isSelected = (option: TComputeMarketplaceV2SelectedOption) => {
    return selectedOptions.some(item => item.id === option.id);
  };

  const gpuLabels = useMemo(() => {
    const countGpuByNames: {[k: string]: number} = {};

    options.forEach(o => {
      if (o.label in countGpuByNames) {
        countGpuByNames[o.label] += o.ids.length;
      } else {
        countGpuByNames[o.label] = o.ids.length;
      }
    });

    return Object.keys(countGpuByNames).map(k => countGpuByNames[k] + " x " + k);
  }, [options]);

  const gpuCount = useMemo(() => {
    return options.reduce((v, o) => v + o.ids.length, 0);
  }, [options]);

  const handleQuantityChange = (optionId: any, newQuantity: string) => {
    const trimmedValue = newQuantity.trim() || '1';
    let quantity = parseInt(trimmedValue);

    if (isNaN(quantity)) {
      quantity = 1;
    }

    quantity = Math.max(Math.min(gpuCount, quantity), 1);

    setInputValues(prevInputValues => ({
      ...prevInputValues,
      [optionId.id]: quantity.toString(),
    }));

    setQuantities(prevQuantities => ({
      ...prevQuantities,
      [optionId.id]: quantity,
    }));

    setSelectedOptions(prevSelectedOptions =>
      prevSelectedOptions.map(option =>
        option.id === optionId.id
          ? {
            ...option,
            quantity: quantity,
            totalPrice: option.price * quantity,
          }
          : option
      )
    );
  };

  return (
    <div ref={refOptions} className="multiple-select" id={id}>
      <p
        className={`title ${active ? 'active' : ''}`}
        onClick={() => setActive((prev) => !prev)}
      >
        {gpuLabels.length === 0 ? num_gpus + "x " +  label : gpuLabels.join(", ")}
        {gpuCount > 1 && <IconArrowLeft/>}
      </p>
      {options.length ? 
        <ul className={`${active ? 'active' : ''}`}>
          {options.map(option => (
            <li key={option.id} className={`${isSelected(option) ? 'option-checked' : ''}`}>
              <Checkbox size='sm' label="" onChange={() => toggleOption(option)} checked={isSelected(option)}/>
              <div className='content'>
                <div className='detail'>
                  <p className='name'>{option.label}</p>
                  <p className='price'>{option.price} {option.tokenSymbol}/hour</p>
                  {option.ids.length > 1 && <p className='available'>Available card: {option.ids.length}</p>}
                </div>
                {option.ids.length > 1 && (
                  <div className='quantity'>
                    <InputBase
                      type="number"
                      value={inputValues[option.id] || "1"}
                      onChange={e => handleQuantityChange(option, e.target.value)}
                      disabled={!isSelected(option)}
                      allowClear={false}
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        : null}

    </div>
  );
};
