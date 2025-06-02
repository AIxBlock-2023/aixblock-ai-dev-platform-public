import {
  IconBoldGlobal,
  IconBoldSms,
  IconCloud,
  IconDocumentUpload,
} from "../assets/icons/Index";

export const SETUP_STEPS = [
  {
    stepIndex: 0,
    stepTitle: "General",
    stepStatus: "general",
  },
  {
    stepIndex: 1,
    stepTitle: "ML",
    stepStatus: "ml",
  },
  // {
  //   stepIndex: 2,
  //   stepTitle: "Cloud Storage",
  //   stepStatus: "cloud_storage",
  // },
  // {
  //   stepIndex: 3,
  //   stepTitle: "Setup Compute",
  //   stepStatus: "setup_compute",
  // },
  {
    stepIndex: 2,
    stepTitle: "Webhooks",
    stepStatus: "webhooks",
  },
  {
    stepIndex: 3,
    stepTitle: "Label Setup",
    stepStatus: "labels",
  },
  {
    stepIndex: 4,
    stepTitle: "Members",
    stepStatus: "members",
  },
  {
    stepIndex: 5,
    stepTitle: "Workflow",
    stepStatus: "workflow",
  }
  // ,
  // {
  //   stepIndex: 6,
  //   stepTitle: "Crowdsource",
  //   stepStatus: "crowdsource",
  // },
];

export const CROWD_STEP = [
  {
    stepIndex: 0,
    stepTitle: "Guideline",
    stepStatus: "upload_guide",
  },
  {
    stepIndex: 1,
    stepTitle: "Questions",
    stepStatus: "create_question",
  },
  {
    stepIndex: 2,
    stepTitle: "Practical",
    stepStatus: "create_practical",
  },
];

export const IMPORT_STEPS = [
  {
    stepIndex: 0,
    stepTitle: "Local upload",
    stepStatus: "local",
    stepSubTitle: "",
    icon: <IconCloud />,
  },
  {
    stepIndex: 1,
    stepTitle: "From/To cloud",
    stepStatus: "cloud",
    stepSubTitle: "",
    icon: <IconDocumentUpload />,
  },
  {
    stepIndex: 2,
    stepTitle: "Crawl from internet, IoT devices",
    stepStatus: "internet",
    stepSubTitle: "",
    icon: <IconBoldGlobal />,
  },
  {
    stepIndex: 3,
    stepTitle: "Contact us to collect custom data",
    stepStatus: "contact_us",
    stepSubTitle: "",
    icon: <IconBoldSms />,
  },
];

export const STATUS_COMPUTE = [
  {
    label: "",
    options: [
      { label: "CREATED", value: "created" },
      { label: "In Marketplace", value: "in_marketplace" },
      { label: "Rented Bought", value: "rented_bought" },
      { label: "Completed", value: "completed" },
      { label: "Pending", value: "pending" },
      { label: "SUPPEND", value: "suppend" },
      { label: "EXPIRED", value: "expired" },
    ],
  },
];

export const ROLE_MEMBER = [
  {
    label: "",
    options: [
      { label: "Labeler", value: "annotator" },
      { label: "QA", value: "qa" },
      { label: "QC", value: "qc" },
      { label: "Admin", value: "admin" },
    ],
  },
];

export const SERVICES = [
  {
    label: "",
    options: [
      { label: "Full", value: "full" },
      { label: "Storage", value: "storage" },
      { label: "GPU", value: "GPU" },
      { label: "Label tool", value: "label_tool" },
    ],
  },
];

export const SIDEBAR_ITEM_LABELS = {
  // top sidebar
  YOUR_PROJECTS: "AI Project list",
  COMPUTES: "Your computes list",
  COMPUTES_SUPPLIER: "Lease out computes",
  MODELS_SELLER: "Commercialize models",
  NOTEBOOK: "Notebook",
  DASHBOARD: "Home",
  SELF_HOST: "Self-host",

  // bot sidebar
  ADMIN: "Admin",
  DOCUMENT: "Documentation",
  PRICING: "Pricing",
  ACCOUNT: "Account Setting",
  WALLET: "Wallet",
  ORGANIZATIONS: "Organizations",
  SWITCH: "Switch Organization",
  ACCOUNT_SETTINGS: "Profile Settings",
  ACCOUNT_REWARDS: "Rewards",
  DISCORD: "Contact for support",
  INFRASTRUCTURE: "My infrastructure",
  MARKETPLACE: "Marketplace",
  OPEN_SOURCE: "Open Source",
  OPEN_DATASET: "Open Dataset",
  WORKFLOWS: "Automation Workflows",
  WORKFLOWS_FLOWS: "Flows",
  WORKFLOWS_RUNS: "Runs",
  WORKFLOWS_CONNECTIONS: "Connections",
  WORKFLOWS_MCP: "MCP",
  WORKFLOWS_BLOCKS: "Blocks",
  WORKFLOWS_AI_PROVIDERS: "AI Providers",
  TEMPLATE_MARKETPLACE: "Template Marketplace",
};

export const HOURS = [
  {
    label: "",
    options: [
      { label: "0", value: "0" },
      { label: "1", value: "1" },
      { label: "2", value: "2" },
      { label: "3", value: "3" },
      { label: "4", value: "4" },
      { label: "5", value: "5" },
      { label: "6", value: "6" },
      { label: "7", value: "7" },
      { label: "8", value: "8" },
      { label: "9", value: "9" },
      { label: "10", value: "10" },
      { label: "11", value: "11" },
      { label: "12", value: "12" },
      { label: "13", value: "13" },
      { label: "14", value: "14" },
      { label: "15", value: "15" },
      { label: "16", value: "16" },
      { label: "17", value: "17" },
      { label: "18", value: "18" },
      { label: "19", value: "19" },
      { label: "20", value: "20" },
      { label: "21", value: "21" },
      { label: "22", value: "22" },
      { label: "23", value: "23" },
    ],
  },
];

export const TOKEN_SYMBOL_DEFAULT = 'USD'
export const TOKEN_NAME_DEFAULT = 'United States Dollar'

export const DEPOSIT_STEP = [
  {
    index: 0,
    title: "Choose payment",
    value: "payment",
    stepSubTitle: "",
  },
  {
    index: 1,
    title: "Deposit",
    value: "deposit",
    stepSubTitle: "",
  },
  {
    index: 2,
    title: "Sign",
    value: "sign",
    stepSubTitle: "",
  },
  {
    index: 3,
    title: "Finish",
    value: "finish",
    stepSubTitle: "",
  }
];

export const PRICE_FP = 3;

export const VIDEO_URL = {
  WATCH_DEMO: "https://www.youtube.com/watch?v=-rghHTsL4LA",
  SETUP_COMPUTE: "https://www.youtube.com/watch?v=kWfoIjEEDRU",
  BUILD_AI: "https://www.youtube.com/watch?v=kWfoIjEEDRU&t=163s",
  COMMERCIALIZE: "https://www.youtube.com/watch?v=kWfoIjEEDRU&t=382s",
  RENT_OUT_COMPUTE: "https://www.youtube.com/watch?v=kWfoIjEEDRU&t=420s",
  WALLET_SETUP: "https://youtu.be/7bJGr4ru7BY",
}
