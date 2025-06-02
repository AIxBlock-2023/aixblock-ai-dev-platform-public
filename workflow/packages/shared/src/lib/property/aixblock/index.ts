export const AIxBlockWaitSubmitFormKey = {
    APPROVE_LINK: 'aixblock-wait-submit-form-approve-link',
    REJECT_LINK: 'aixblock-wait-submit-form-reject-link',
};

export const AIxBlockWaitSubmitMultimodalKey = {
    APPROVE_LINK: 'aixblock-wait-submit-multimodal-approve-link',
    REJECT_LINK: 'aixblock-wait-submit-multimodal-reject-link',
};

export const AIxBlockWebFormWaitSubmit = {
    APPROVE_LINK: 'aixblock-web-form-wait-approve-link',
    REJECT_LINK: 'aixblock-web-form-wait-reject-link',
};

export const AIxBlockPredictMlUrl = 'aixblock-predict-ml-url'

export const AIxBlockTaskStatus = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export const AIxBlockTaskStatusOptions = [
    {
        label: 'Todo',
        value: AIxBlockTaskStatus.TODO,
    },
    {
        label: 'In Progress',
        value: AIxBlockTaskStatus.IN_PROGRESS,
    },
    {
        label: 'Resolved',
        value: AIxBlockTaskStatus.RESOLVED,
    },
    {
        label: 'Approved',
        value: AIxBlockTaskStatus.APPROVED,
    },
    {
        label: 'Rejected',
        value: AIxBlockTaskStatus.REJECTED,
    },
];

export interface LLmTypes {
    components: {
        id: string;
        type: string;
        options: Options;
    }[];
    layout: Layout[];
    code: string;
}

interface Options {
    tabs?: Tab[];
    label?: string;
    idLabelRequired?: boolean;
    placeholder?: string;
    showInfo?: boolean;
    tooltip?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    excludeFormExport?: boolean;
    showLabel?: boolean;
    showIcon?: boolean;
    icon: any;
    columns?: Column[];
    value?: string;
    numberOfStar?: number;
    optionType?: string;
    defaultOptions?: DefaultOption[];
    options?: Option[];
    includeTime?: boolean;
    min: any;
    max: any;
    step?: number;
}

interface Tab {
    id: string;
    label: string;
    children: Children[];
}

interface Column {
    id: string;
    size: number;
    children: Children[];
}

interface Children {
    id: string;
    type: string;
    children: any[];
}

interface DefaultOption {
    value: string;
    label: string;
}

interface Option {
    value: string;
    label: string;
}

interface Layout {
    id: string;
    type: string;
    children: any[];
}
