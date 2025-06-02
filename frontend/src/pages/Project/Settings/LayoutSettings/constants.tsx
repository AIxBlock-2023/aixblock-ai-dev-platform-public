import {
  IconBoldGlobal,
  IconBoldSms,
  IconCloud,
  IconDocumentUpload,
} from "@/assets/icons/Index";

export const PARENT_STEPS = [
  {
    index: 0,
    title: "Setup",
    value: "settings",
    rootPath: "settings",
  },
  {
    index: 1,
    title: "Data",
    value: "import",
    rootPath: "import",
  },
  {
    index: 2,
    title: "Done",
    value: "create_done",
    rootPath: "create_done",
  },
];

export const IMPORT_STEPS = [
  {
    index: 0,
    title: "Local upload",
    value: "local",
    icon: <IconCloud />,
  },
  {
    index: 1,
    title: "From/To cloud",
    value: "cloud",
    icon: <IconDocumentUpload />,
  },
  {
    index: 2,
    title: "Crawl from internet, IoT devices",
    value: "internet",
    icon: <IconBoldGlobal />,
  },
  {
    index: 3,
    title: "Contact us to collect custom data",
    value: "contact_us",
    icon: <IconBoldSms />,
  },
];

export const CHILDREN_STEPS = [
  {
    index: 0,
    title: "General",
    value: "general",
  },
  {
    index: 1,
    title: "Machine Learning",
    value: "ml",
  },
  {
    index: 2,
    title: "Webhooks",
    value: "webhooks",
  },
  {
    index: 3,
    title: "Label",
    value: "labels",
  },
  {
    index: 4,
    title: "Member",
    value: "members",
  },
  {
    index: 5,
    title: "Labeling Workflow",
    value: "workflow",
	}
	// ,
  // {
  //   index: 6,
  //   title: "Crowd Source Your Project",
  //   value: "crowdsource",
  // },
];

export const CROWD_STEPS = [
  {
    index: 0,
    title: "Upload Guildline",
    value: "upload_guildline",
  },
  {
    index: 1,
    title: "Qualification test",
    value: "qualification_test",
  },
];

export const ROUTE = [
  "document",
  "organization",
  "computes",
  "computes-marketplace",
  "computes-supplier",
  "models-seller",
  "pricing",
  "admin",
  "user",
  "dashboard",
  "rented-models",
  "self-host",
  "lease-out-compute",
  "infrastructure",
  "marketplace",
  "models-marketplace",
  "workflows",
  "template-marketplace",
];

export const GENERAL_ENUM = {
  title: "title",
  description: "description",
  gpu: "gpu",
  type: "type",
  color: "color",
};

export const COLOR_LIST = [
  { color: "#a2a2a2", value: "#a2a2a2", name: "gray" },
  { color: "#5050FF", value: "#5050FF", name: "blue" },
  { color: "#F5A", value: "#F5A", name: "pink" },
  { color: "#F2415A", value: "#F2415A", name: "red" },
  { color: "#FFBF0F", value: "#FFBF0F", name: "yellow" },
  { color: "#D9F04B", value: "#D9F04B", name: "green-light" },
  { color: "#27BE69", value: "#27BE69", name: "green" },
];
