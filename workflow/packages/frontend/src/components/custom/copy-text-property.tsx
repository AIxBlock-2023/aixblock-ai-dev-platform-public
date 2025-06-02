import { aixblockApi } from '@/lib/aixblock-api';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { getScopeAndKey, PieceStoreScope } from 'workflow-shared';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

type CopyTextPropertyProps = {
    fieldKey: string;
    flowId: string;
    flowRunId: string;
    outputData: any;
};

const CopyTextProperty = React.memo(({ fieldKey, flowId, flowRunId, outputData }: CopyTextPropertyProps) => {
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const [value, setValue] = useState<string>('');
    const { toast } = useToast();

    const { mutate: copyToClipboard } = useMutation({
        mutationFn: async (text: string) => {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setCopiedText(null);
        },
        onError: () => {
            toast({
                title: t('Failed to copy to clipboard'),
                duration: 3000,
            });
        },
    });

    useEffect(() => {
        initData();
    }, [outputData]);

    const initData = async () => {
        try {
            const resp = await aixblockApi.getStoreData({
                flowId,
                flowRunId,
                key: getScopeAndKey(PieceStoreScope.FLOW, fieldKey, flowId, flowRunId).key,
            });
            if (typeof resp !== 'string') {
                setValue('');
            } else {
                setValue(resp as string);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const isCopying = copiedText === value;

    return (
        <>
            <div className="relative w-full items-center flex text-sm justify-between rounded block w-full gap-1 p-1.5 px-0">
                <Input value={value} disabled={true} type="text" id="copy-text-property" className="w-full" />
                <Button
                    variant="ghost"
                    className="bg-background rounded p-2 inline-flex items-center justify-center h-8"
                    onClick={() => copyToClipboard(value)}
                >
                    {isCopying ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
            </div>
        </>
    );
});

CopyTextProperty.displayName = 'CopyTextProperty';
export { CopyTextProperty };
