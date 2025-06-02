import { t } from 'i18next';
import { Calendar, File, SquareFunction } from 'lucide-react';
import { ControllerRenderProps, useFormContext } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import {
  DropdownProperty,
  PieceProperty,
  PropertyType,
} from 'workflow-blocks-framework';
import { Action, Trigger } from 'workflow-shared';

import { ArrayPiecePropertyInInlineItemMode } from './array-property-in-inline-item-mode';
import { TextInputWithMentions } from './text-input-with-mentions';

import TrainLinkToMarket from '@/app/components/train-link-to-market';
import { useEmbedding } from '@/components/embed-provider';
import { FormItem, FormLabel } from '@/components/ui/form';
import { ReadMoreDescription } from '@/components/ui/read-more-description';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SelectOption, useAIxBlock } from '@/hooks/aixblock-hooks';
import { cn, parentWindow } from '@/lib/utils';
import { WorkflowClientEventName } from 'axb-embed-sdk';
import { forEach, get, size, some } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

type inputNameLiteral = `settings.input.${string}`;

const isInputNameLiteral = (
  inputName: string,
): inputName is inputNameLiteral => {
  return inputName.match(/settings\.input\./) !== null;
};

type AutoFormFieldWrapperProps = {
  children: React.ReactNode;
  allowDynamicValues: boolean;
  propertyName: string;
  property: PieceProperty;
  hideDescription?: boolean;
  placeBeforeLabelText?: boolean;
  disabled: boolean;
  field: ControllerRenderProps;
  inputName: string;
};

const AutoFormFieldWrapper = ({
  placeBeforeLabelText = false,
  children,
  hideDescription,
  allowDynamicValues,
  propertyName,
  inputName,
  property,
  disabled,
  field,
}: AutoFormFieldWrapperProps) => {
  const { embedState } = useEmbedding();
  const { getCpus, isFetchCpu } = useAIxBlock();
  const params = useParams();
  const [listCompute, setListCompute] = useState<SelectOption[]>([]);
  const [validModelTflops, setValidModelTflops] = useState<boolean>(true);
  const [validModelVram, setValidModelVram] = useState<boolean>(true);
  const [validModelNodes, setValidModelNodes] = useState<boolean>(true);
  const form = useFormContext<Action | Trigger>();

  const dynamicInputModeToggled =
    form.getValues().settings?.inputUiInfo?.customizedInputs?.[propertyName] ===
    true;

  function handleChange(mode: boolean) {
    const newCustomizedInputs = {
      ...form.getValues().settings?.inputUiInfo?.customizedInputs,
      [propertyName]: mode,
    };
    form.setValue(
      `settings.inputUiInfo.customizedInputs`,
      newCustomizedInputs,
      {
        shouldValidate: true,
      },
    );
    if (isInputNameLiteral(inputName)) {
      form.setValue(inputName, property.defaultValue ?? null, {
        shouldValidate: true,
      });
    } else {
      throw new Error(
        'inputName is not a member of step settings input, you might be using dynamic properties where you should not',
      );
    }
  }
  const isArrayProperty = property.type === PropertyType.ARRAY;
  const linkToModelMarketplace = (property as DropdownProperty<any, boolean>)
    ?.linkToModelMarketplace;

  const handleClientRouteChange = (route: string) => {
    parentWindow.postMessage(
      {
        type: WorkflowClientEventName.CLIENT_ROUTE_CHANGED,
        data: {
          flowId: params.flowId,
          route: route,
        },
      },
      '*',
    );
  };

  const handleGetListCompute = useCallback(
    async (projectId: string) => {
      const result = await getCpus(projectId);
      const listSelect: SelectOption[] = [];
      forEach(result, (compute) => {
        if (compute.compute_cpu && compute.compute_cpu.cpu) {
          listSelect.push({
            value: 'compute_cpu',
            label: `${compute.compute_cpu.cpu} / ${compute.compute_name}`,
            data: compute,
          });
        }
        if (size(compute.compute_gpus) > 0) {
          forEach(compute.compute_gpus, (gpu) => {
            listSelect.push({
              value: 'compute_gpus',
              label: `${gpu.gpu_name} / ${compute.compute_name}`,
              data: gpu,
            });
          });
        }
      });

      setListCompute(listSelect);
    },
    [getCpus],
  );

  const renderErrorModel = () => {
    if (!listCompute.length) {
      return t('You must have at least one compute.')
    }
    if (!validModelTflops) {
      return t('Your computes don\'t have enough tflops for this model');
    }
    if (!validModelVram) {
      return t('Your computes don\'t have enough vram for this model')
    }
    if (!validModelNodes) {
      return t('Your computes don\'t have enough nodes for this model');
    }
  }

  const handleCheckConfigModel = () => {
      try {
        const selectedModelValue = JSON.parse(field.value);
        const modelConfig = JSON.parse(selectedModelValue.config);

        // Check tflops
        const tflops = get(modelConfig, 'weights[0].tflops');
        if (some(listCompute, (compute) => {
          if (Number(compute?.data?.gpu_tflops) > Number(tflops)) return true;
          return false;
        })) {
          setValidModelTflops(true);
        } else {
          setValidModelTflops(false);
        }

        // Check vram
        const vram = get(modelConfig, 'weights[0].vram');
        if (some(listCompute, (compute) => {
          if ((Number(compute?.data?.gpu_memory) / 1_000_000_000) > Number(vram)) return true;
          return false;
        })) {
          setValidModelVram(true);
        } else {
          setValidModelVram(false);
        }

        // Check nodes
        const nodes = get(modelConfig, 'weights[0].nodes');
        if (listCompute.length >= nodes) {
          setValidModelNodes(true);
        } else {
          setValidModelNodes(false);
        }
      } catch (e) {
        console.error(e);
      }
  }

  useEffect(() => {
    if (embedState.isEmbedded && linkToModelMarketplace) handleGetListCompute('0');
  }, [handleGetListCompute, embedState, params, linkToModelMarketplace]);

  useEffect(() => {
    if (embedState.isEmbedded && linkToModelMarketplace) handleCheckConfigModel();
  }, [linkToModelMarketplace, field.value, embedState.isEmbedded, listCompute])
  return (
    <FormItem className="flex flex-col gap-1">
      {linkToModelMarketplace && (
        <TrainLinkToMarket
          handleGetListCompute={handleGetListCompute}
          isFetchCpu={isFetchCpu}
          listCompute={listCompute}
        />
      )}
      <FormLabel className="flex items-center gap-1 ">
        {placeBeforeLabelText && !dynamicInputModeToggled && children}
        {(property.type === PropertyType.FILE ||
          property.type === PropertyType.DATE_TIME) && (
          <Tooltip>
            <TooltipTrigger asChild>
              {property.type === PropertyType.FILE ? (
                <File className="w-4 h-4 stroke-foreground/55"></File>
              ) : (
                property.type === PropertyType.DATE_TIME && (
                  <Calendar className="w-4 h-4 stroke-foreground/55"></Calendar>
                )
              )}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <>
                {property.type === PropertyType.FILE && t('File Input')}
                {property.type === PropertyType.DATE_TIME && t('Date Input')}
              </>
            </TooltipContent>
          </Tooltip>
        )}
        <div className="pt-1">
          <span>{t(property.displayName)}</span>{' '}
          {property.required && <span className="text-destructive">*</span>}
        </div>

        <span className="grow"></span>
        {allowDynamicValues && (
          <div className="flex gap-2 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={dynamicInputModeToggled}
                  onPressedChange={(e) => handleChange(e)}
                  disabled={disabled}
                >
                  <SquareFunction
                    className={cn('size-5', {
                      'text-foreground': dynamicInputModeToggled,
                      'text-muted-foreground': !dynamicInputModeToggled,
                    })}
                  />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-background">
                {t('Dynamic value')}
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </FormLabel>

      {linkToModelMarketplace && embedState.isEmbedded && (
        <button
          onClick={() => handleClientRouteChange('/marketplace/models')}
          className="self-start text-muted-foreground text-xs hover:text-primary underline mt-1"
        >
          {t('Go to Model Marketplace')}
        </button>
      )}

      {dynamicInputModeToggled && !isArrayProperty && (
        <TextInputWithMentions
          disabled={disabled}
          onChange={field.onChange}
          initialValue={field.value ?? property.defaultValue ?? null}
        />
      )}

      {isArrayProperty && dynamicInputModeToggled && (
        <ArrayPiecePropertyInInlineItemMode
          disabled={disabled}
          arrayProperties={property.properties}
          inputName={inputName}
          onChange={field.onChange}
          value={field.value ?? property.defaultValue ?? null}
        />
      )}

      {!placeBeforeLabelText && !dynamicInputModeToggled && (
        <div>{children}</div>
      )}
      {property.description && !hideDescription && (
        <ReadMoreDescription text={t(property.description)} />
      )}
      {linkToModelMarketplace && (
        <div className='text-destructive text-sm'>
          {renderErrorModel()}
        </div>
      )}
    </FormItem>
  );
};

AutoFormFieldWrapper.displayName = 'AutoFormFieldWrapper';

export { AutoFormFieldWrapper };

