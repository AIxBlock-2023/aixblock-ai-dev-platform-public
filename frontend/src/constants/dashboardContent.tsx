import IconPlus from "../assets/icons/IconPlus";
import { IconMarketplace } from "../assets/icons/Index";

export const DASHBOARD_CREATE = [
  // {
  //   index: 1,
  //   title: <><strong>Train and Deploy</strong> (coming soon)</>,
  //   subTitle: "If you want to start with raw source code, then train your model with your own data, and optionally deploy it",
  //   icon: <IconPlus />,
  //   url: "/train-and-deploy/",
  //   disabled: true,
  // },
  {
    index: 2,
    title: <><strong>Fine-Tune and Deploy</strong></>,
    subTitle: <>
      If you want to fine-tune or deploy any models—whether it’s your own, from model hubs like Hugging Face or Roboflow, or rented from our model marketplace—select this option. <strong>Note:</strong> If you also want to customize the input/output formats of your dataset and define your own labeling UI, please select <strong>Option 3</strong> instead.
    </>,
    icon: <IconPlus />,
    url: "/fine-tune-and-deploy/"
  },
  // {
  //   index: 3,
  //   title: <><strong>Deploy Only</strong></>,
  //   subTitle: "Deploy models or set up API inference endpoints using your uploaded models, or our decentralized model marketplace, or models from other hubs. We support nearly all popular foundation models.",
  //   icon: <IconPlus />,
  //   url: "/deploy/",
  // },
  {
    index: 4,
    title: <><strong>Label & Validate Data</strong></>,
    subTitle: <>
      If you only need to label data, validate data, or validate the output of a model, select this option. <strong>Note:</strong> If you also want to customize the input/output formats of your dataset and define your own labeling UI, please select <strong>Option 3</strong> instead.
    </>,
    icon: <IconPlus />,
    url: "/label-and-validate-data/"
  },
  {
    index: 6,
    title: <><strong>AI automation workflow</strong></>,
    subTitle: <>
      <strong>Use this if you want to: </strong>
      <ol>
        <li>Train models with custom input/output formats</li>
        <li>Label or train multimodal datasets</li>
        <li>Build/monetize AI automation workflows using models from diverse providers, model hubs like Hugging Face, or even your own</li>
        <li>Connect AI agents (e.g., Cursor, Windsurf, or your own) to 300+ tools and workflows via our MCP hub</li>
      </ol>
    </>,
    icon: <IconPlus />,
    url: "/workflows/flows",
  },
  // {
  //   index: 5,
  //   title: <><strong>Build and Deploy Multi AI Agent</strong></>,
  //   subTitle: "Create AI teams where each agent has specific roles, tools, and goals, working together to automate any workflows.",
  //   icon: <IconPlus />,
  //   url: "https://multiagent.aixblock.io",
  // },
]

export const DASHBOARD_COMPUTES = [
  {
    index: 1,
    title: <>Setup infrastructure</>,
    subTitle: "Begin by setting up your storage, server, or GPUs. This setup is done at the account level, allowing all of your team members across projects to access.",
    icon: <IconPlus />,
    url: "/infrastructure/setup-storage/cloud",
  },
  // {
  //   index: 5,
  //   title: <>Self-host platform</>,
  //   subTitle: "You can instantly self-host the entire AIxBlock platform on your own infrastructure, ensuring complete privacy and security. No setup fees, no long-term commitments required.",
  //   icon: <IconFolderConnection />,
  //   url: "/self-host",
  // },
  // {
  //   index: 4,
  //   title: <>Compute Marketplace</>,
  //   subTitle: "Explore our decentralized computing marketplace to rent on-demand compute resources. Enjoy diverse global options at fractional costs with no vendor lock-in.",
  //   icon: <IconMarketplace />,
  //   url: "/marketplace/computes",
  // },
  // {
  //   index: 2,
  //   title: <>Lease out computes</>,
  //   subTitle: "If you have idle compute resources that you want to lease out to the marketplace to earn extra money, select this option.",
  // },
  {
    index: 3,
    title: <>Your Compute List</>,
    subTitle: "All the compute resources in your account, including CPU, GPU, server, and storage, are listed here.",
    url: "/infrastructure/gpu/from-marketplace",
  },
  {
    index: 6,
    title: <>My rented models</>,
    subTitle: "View and manage the list of machine learning models you have rented for your projects.",
    url: "/rented-models",
  },
]

export const DASHBOARD_MODELS = [
  {
    index: 2,
    title: <>Commercialize my model</>,
    subTitle: "To commercialize your model, click here. Enjoy easy setup with no listing fees and a small transaction fee only when you earn. No compute resources? No problem. We auto-scale to meet your demand.",
    icon: <IconPlus />,
    url: "/models-seller",
  },
  {
    index: 3,
    title: <>My rented models</>,
    subTitle: "View and manage the list of machine learning models you have rented for your projects.",
    url: "/rented-models",
  },
  {
    index: 4,
    title: <>Model Marketplace</>,
    subTitle: "Check out our model marketplace to rent models for fine-tuning, labeling assistance or API inference endpoints",
    icon: <IconMarketplace />,
    url: "/marketplace/models",
  },
]

export const DASHBOARD_MARKETPLACES = [
  {
    index: 1,
    title: <>Compute</>,
    subTitle: "Access high-end GPUs on demand, with up to 90% lower costs.",
    icon: <IconMarketplace />,
    url: "/marketplace/computes",
  },
  {
    index: 2,
    title: <>AI/ML Models</>,
    subTitle: "Explore models for fine-tuning or use them directly in your AI workflows.",
    icon: <IconMarketplace />,
    url: "/marketplace/models",
  },
  {
    index: 3,
    title: <>AI Automation Templates</>,
    subTitle: "Monetize your AI workflow templates — whether built with n8n, Make.com, Zapier, or directly on AIxBlock.",
    icon: <IconMarketplace />,
    url: "/marketplace/workflow",
  },
]
