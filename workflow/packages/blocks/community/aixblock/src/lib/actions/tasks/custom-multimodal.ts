import { createAction, PieceAuth, Property, StoreScope } from 'workflow-blocks-framework';
import { AIxBlockWaitSubmitMultimodalKey, ExecutionType, MarkdownVariant, PauseType, USE_DRAFT_QUERY_PARAM_NAME } from 'workflow-shared';

const markdown = `
## **This plugin will support admin to custom multimodal.**
<br>
<br>
**Published Form URL:**
\`\`\`text
{{aixblockCustomMultimodalUrl}}
\`\`\`
Use this for production, views the published version of the form.
<br>
<br>
**Draft Form URL:**
\`\`\`text
{{aixblockCustomMultimodalUrl}}${USE_DRAFT_QUERY_PARAM_NAME}=true
\`\`\`
Use this to generate sample data, views the draft version of the form (the one you are editing now).
`;

export const customMultimodal = createAction({
    name: 'custom-multimodal',
    displayName: 'Custom multimodal',
    auth: PieceAuth.None(),
    description: 'This plugin will support admin to custom multimodal',
    requireAuth: false,
    props: {
        about: Property.MarkDown({
            value: markdown,
            variant: MarkdownVariant.BORDERLESS,
        }),
        storeKey: Property.ShortText({
            displayName: 'Store key',
            required: true,
            defaultValue: 'custom_multimodal',
            description: 'This key will be use to store config of multimodal and re-use in next step',
        }),
    },
    async run(context) {
        const approveStoreKey = `${AIxBlockWaitSubmitMultimodalKey.APPROVE_LINK}/flowRunId_${context.run.id}`;
        const rejectStoreKey = `${AIxBlockWaitSubmitMultimodalKey.REJECT_LINK}/flowRunId_${context.run.id}`;

        if (context.executionType === ExecutionType.BEGIN) {
            context.run.pause({
                pauseMetadata: {
                    type: PauseType.WEBHOOK,
                    response: {},
                },
            });
            const approveLink = context.generateResumeUrl({
                queryParams: { action: 'approve' },
            });
            const rejectLink = context.generateResumeUrl({
                queryParams: { action: 'reject' },
            });

            const promises = [
                context.store.put(approveStoreKey, approveLink, StoreScope.FLOW),
                context.store.put(rejectStoreKey, rejectLink, StoreScope.FLOW),
            ];

            await Promise.all(promises);

            return {
                approveLink,
                rejectLink,
            };
        } else {
            context.store.delete(approveStoreKey, StoreScope.FLOW);
            context.store.delete(rejectStoreKey, StoreScope.FLOW);
            const approve = context.resumePayload.queryParams['action'] === 'approve';
            if (!approve) {
                context.run.stop();
                return { isValid: false };
            }
            return { isValid: true };
        }
    },
});
