import { httpClient, HttpMethod } from 'workflow-blocks-common';
import { createAction, PieceAuth, Property, StoreScope } from 'workflow-blocks-framework';
import { AIxBlockWebFormWaitSubmit, ExecutionType, MarkdownVariant, PauseType, USE_DRAFT_QUERY_PARAM_NAME } from 'workflow-shared';

const markdown = `
## **This plugin will support for user to customize the form and submit the form data to the flow.**
<br>
<br>
**Published Form URL:**
\`\`\`text
{{aixblockActionFormUrl}}
\`\`\`
Use this for production, views the published version of the form.
<br>
<br>
**Draft Form URL:**
\`\`\`text
{{aixblockActionFormUrl}}${USE_DRAFT_QUERY_PARAM_NAME}=true
\`\`\`
Use this to generate sample data, views the draft version of the form (the one you are editing now).
`;
const responseMarkdown = `
If **Wait for Response** is enabled, use **Respond on UI** in your flow to provide a response back to the form.
`;

export const aixBlockWebForm = createAction({
    name: 'form_action',
    displayName: 'Web Form',
    auth: PieceAuth.None(),
    description: 'Trigger the flow by submitting a form.',
    requireAuth: false,
    props: {
        about: Property.MarkDown({
            value: markdown,
            variant: MarkdownVariant.BORDERLESS,
        }),
        response: Property.MarkDown({
            value: responseMarkdown,
            variant: MarkdownVariant.WARNING,
        }),
        inputs: Property.Array({
            displayName: 'Inputs',
            required: true,
            properties: {
                displayName: Property.ShortText({
                    displayName: 'Field Name',
                    required: true,
                }),
                type: Property.StaticDropdown({
                    displayName: 'Field Type',
                    required: true,
                    options: {
                        options: [
                            { value: 'text', label: 'Text' },
                            { value: 'text_area', label: 'Text Area' },
                            { value: 'file', label: 'File' },
                            { value: 'toggle', label: 'Toggle' },
                            { value: 'radio', label: 'Radio' },
                            { value: 'dropdown', label: 'Dropdown' },
                        ],
                    },
                }),
                dataSource: Property.LongText({
                    displayName: 'Data source',
                    required: false,
                }),
                rowIndex: Property.Number({
                    displayName: 'Row index (1-6)',
                    required: true,
                }),
                columnIndex: Property.Number({
                    displayName: 'Column index (1-6)',
                    required: true,
                }),
                description: Property.ShortText({
                    displayName: 'Field Description',
                    required: false,
                }),
                required: Property.Checkbox({
                    displayName: 'Required',
                    required: true,
                }),
            },
        }),
    },
    async run(context) {
        const approveStoreKey = `${AIxBlockWebFormWaitSubmit.APPROVE_LINK}/flowRunId_${context.run.id}`;
        const rejectStoreKey = `${AIxBlockWebFormWaitSubmit.REJECT_LINK}/flowRunId_${context.run.id}`;

        const flowRunId = context.run.id;
        const flowVersionId = context.flowVersionId;
        const projectId = context.project.id;
        const stepName = context.stepName;
        const useDraft = context.run.id.includes('test-run') ? true : false;

        const getFormDataFromStore = async () => {
            const url = `${context.server.apiUrl}v1/aixblock-web-forms/form-action/get-form-data/${context.flows.current.id}`;
            const response = await httpClient.sendRequest<string[]>({
                method: HttpMethod.GET,
                url: url,
                queryParams: {
                    stepName: stepName,
                    projectId: projectId,
                    flowVersionId: flowVersionId,
                    flowRunId: flowRunId,
                    useDraft: useDraft.toString(),
                },
                headers: {
                    Authorization: `Bearer ${context.server.token}`,
                },
            });
            return response.body;
        };

        const deleteCurrentDataFromStore = async () => {
            const url = `${context.server.apiUrl}v1/aixblock-web-forms/form-action/delete-form-data/${context.flows.current.id}`;
            const response = await httpClient.sendRequest<string[]>({
                method: HttpMethod.DELETE,
                url: url,
                queryParams: {
                    stepName: stepName,
                    projectId: projectId,
                    flowVersionId: flowVersionId,
                    flowRunId: flowRunId,
                    useDraft: useDraft.toString(),
                },
                headers: {
                    Authorization: `Bearer ${context.server.token}`,
                },
            });
            return response.body;
        };

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
                deleteCurrentDataFromStore();
                context.run.stop();
                return {};
            }
            let output: Record<string, unknown> = {};
            const resp: any = await getFormDataFromStore();
            if (resp?.value) {
                output = resp.value;
                deleteCurrentDataFromStore();
            }
            return output;
        }
    },
});
