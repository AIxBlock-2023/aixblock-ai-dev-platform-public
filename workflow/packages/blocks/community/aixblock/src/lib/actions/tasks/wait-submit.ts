import { createAction, PieceAuth, Property, StoreScope } from 'workflow-blocks-framework';
import { AIxBlockWaitSubmitFormKey, ExecutionType, MarkdownVariant, PauseType, USE_DRAFT_QUERY_PARAM_NAME } from 'workflow-shared';

const markdown = `
## **This plugin will support for user to show the list of tasks.**
<br>
<br>
**Published Form URL:**
\`\`\`text
{{aixblockListTasksUrl}}
\`\`\`
Use this for production, views the published version of the form.
<br>
<br>
**Draft Form URL:**
\`\`\`text
{{aixblockListTasksUrl}}${USE_DRAFT_QUERY_PARAM_NAME}=true
\`\`\`
Use this to generate sample data, views the draft version of the form (the one you are editing now).
`;

export const waitSubmit = createAction({
    name: 'wait_submit',
    displayName: 'Wait Submit',
    auth: PieceAuth.None(),
    description: 'Delays the execution of the next action until approval',
    requireAuth: false,
    props: {
        about: Property.MarkDown({
            value: markdown,
            variant: MarkdownVariant.BORDERLESS,
        }),
        mappingKeyDataSource: Property.ShortText({
            displayName: 'Mapping key data source',
            required: true,
        }),
        multimodalKey: Property.ShortText({
            displayName: 'Multimodal key',
            required: true,
        }),
    },
    async run(context) {

        const approveStoreKey = `${AIxBlockWaitSubmitFormKey.APPROVE_LINK}/flowRunId_${context.run.id}`;
        const rejectStoreKey = `${AIxBlockWaitSubmitFormKey.REJECT_LINK}/flowRunId_${context.run.id}`;

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
