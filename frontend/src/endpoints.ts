export function getEndpoint(endpoint: keyof typeof Endpoints): [string, string] {
  if (!Object.hasOwn(Endpoints, endpoint)) {
    return ["", ""];
  }

  const endpointParts = Endpoints[endpoint].split(":");
  const method = endpointParts.shift() ?? "";
  const url = endpointParts.join(":");
  return [method, url];
}

const Endpoints: { [k: string]: string } = {
  login: "POST:user/login/",
  signup: "POST:api/user/signup",
  whoami: "GET:api/current-user/whoami",
  projects: "GET:api/projects/list",
  projectDetail: "GET:api/projects/:id/",
  actions: "GET:api/dm/actions?project=:id",
  columns: "GET:api/dm/columns?project=:id",
  views: "GET:api/dm/views?project=:id",
  createView: "POST:api/dm/views",
  updateView:
    "PATCH:api/dm/views/:id?project=:project&interaction=:interaction",
  closeView: "DELETE:api/dm/views/:id?project=:project",
  doAction: "POST:api/dm/actions?id=:id&tabID=:tabID&project=:project",
  tasks: "GET:api/tasks",
  task: "GET:api/tasks/:id?project=:project",
  lockTask: "POST:api/tasks/:id/lock",
  releaseTask: "POST:api/tasks/:id/release",
  submitAnnotation: "POST:api/tasks/:id/annotations?project=:project",
  updateAnnotation: "PATCH:api/annotations/:id?taskID=:task&project=:project",
  deleteAnnotation: "DELETE:api/annotations/:id?taskID=:task&project=:project",
  redactAnnotation: "POST:api/annotations/:id/redact",
  createDraftForTask: "POST:api/tasks/:task/drafts",
  createDraftForAnnotation:
    "POST:api/tasks/:task/annotations/:annotation/drafts",
  updateDraft: "PATCH:api/drafts/:id",
  deleteDraft: "DELETE:api/drafts/:id",
  templates: "GET:api/annotation_template",
  gpu: "GET:api/projects/0/gpu",
  createProjects: "POST:api/projects/",
  updateProject: "PATCH:api/projects/:id/",
  deleteProject: "DELETE:api/projects/:id/",
  resetToken: "POST:api/current-user/reset-token/",
  getUser: "GET:api/users/:id/",
  updateUser: "PATCH:api/users/:id/",
  getUserToken: "GET:api/current-user/token",
  memberLists: "GET:api/organizations/:id/memberships",
  importFiles: "POST:api/projects/:id/import",
  reimportFiles: "POST:/projects/:pk/reimport",
  compactUser: "GET:api/user/:id",
  previousExports: "GET:api/projects/:id/export/files",
  exportFormats: "GET:api/projects/:id/export/formats",
  export: "GET:api/projects/:id/export?exportType=:exportType",
  exportCustomFormat: "POST:api/projects/:id/export-custom",
  inviteMember: "POST:api/invite/csv",
  users: "GET:api/users",
  createUser: "POST:api/users/",
  deleteUsers: "DELETE:api/users/:id",
  myOrganizations: "GET:api/organizations/",
  mlBackends: "GET:api/ml",
  mlNetWork: "GET:api/ml/ml-network",
  updateRoutingMode: "POST:api/ml/ml-network/routing-mode",
  updateTask: "PATCH:api/tasks/:id",
  deleteMember: "POST:api/organizations/remove-member",
  organizationList: "GET:api/organizations/admin",
  UserRoleInProject: "GET:api/organizations/role-user",
  adminOrgCreate: "POST:api/organizations/admin/create",
  adminOrgDelete: "DELETE:api/organizations/delete/:id",
  adminOrgUpdate: "PATCH:api/organizations/update/:id",
  updateUserAvatar: "POST:api/users/:id/avatar",
  deleteUserAvatar: "DELETE:api/users/:id/avatar",
  switchOrganization: "POST:api/current-user/switch-organization",
  notifications: "GET:api/current-user/notifications",
  markNotifications: "POST:api/current-user/notification-action",
  deleteCompute: "DELETE:api/compute_marketplace/:id",
  deleteModel: "DELETE:api/model_marketplace/:id",
  deleteHistoryBuildandDeployModel: "DELETE:api/model_marketplace/history-build-deploy/:id",
  updateModel: "PATCH:api/model_marketplace/update-model/:id",
  createModel: "POST:api/model_marketplace/",
  mlBackendsByPrj: "GET:api/ml/",
  getMlBackendByMlId: "GET:api/ml/:id",
  delMLBackend: "DELETE:api/ml/:id",
  createMLBackend: "POST:api/ml/",
  updateMLConfig: "PATCH:api/ml/:id/update-config",
  startStopMLDocker: "GET:api/ml/docker",
  listComputeSupply: "GET:api/compute_marketplace/list-supply",
  listComputeRented: "GET:api/compute_marketplace/list-rented",
  computeGpus: "GET:api/compute_marketplace/gpus",
  listSellModelMarketplace: "GET:api/model_marketplace/list-sell",
  getListCompute: "GET:api/compute_marketplace/",
  getListComputeCatalog: "GET:api/compute_marketplace/catalog",
  getListComputeCatalogByPage: "GET:api/compute_marketplace/admin/catalog",
  getListAnnotationTemplateByPage: "GET:api/annotation_template/admin/catalog",
  getListModel: "GET:api/model_marketplace/",
  getListModelCatalog: "GET:api/model_marketplace/catalog",
  createCompute: "POST:api/compute_marketplace/",
  updateCompute: "PATCH:api/compute_marketplace/update/:id",
  deleteCataCompute: "DELETE:api/compute_marketplace/catalog/:id",
  updateCataCompute: "PATCH:api/compute_marketplace/catalog-update/:id",
  getListModelCatalogByPage: "GET:api/model_marketplace/admin/catalog",
  updateCataModel: "PATCH:api/model_marketplace/catalog-update/:id",
  deleteCataModel: "DELETE:api/model_marketplace/catalog/:id",
  templatesList: "GET:api/annotation_template/list",
  updateAnnoTemp: "PATCH:api/annotation_template/update/:id",
  createAnnoTemp: "POST:api/annotation_template",
  deleteAnnoTemp: "DELETE:api/annotation_template/delete/:id",
  createCataCompute: "POST:api/compute_marketplace/catalog-create",
  createCataModel: "POST:api/model_marketplace/catalog-create",
  createComputeByUser: "POST:api/compute_marketplace/user/create/",
  rentComputeApi: "PATCH:api/compute_marketplace/rent/:id",
  rentComputeV2Api: "POST:api/compute_marketplace/rent/",
  rentComputeV2ApiCrypto: "POST:api/crypto-payment/create-order",
  updateModelMarketplace: "PATCH:api/model_marketplace/update/:id",
  computeMkpCreateUser: "POST:api/compute_marketplace/user/create",
  createFull: "POST:api/compute_marketplace/user/create-full/",
  getTokenWorker: "GET:api/compute_marketplace/user/token-worker/",
  getSecretId: "GET:api/compute_marketplace/user/secret-id",
  getCheckpointModelMarketplace: "GET:api/checkpoint_model_marketplace",
  updateCheckpointModelMarketplace:
    "PATCH:api/checkpoint_model_marketplace/:id",
  getDatasetModelMarketplace: "GET:api/dataset_model_marketplace",
  updateDatasetModelMarketplace: "PATCH:api/dataset_model_marketplace/:id",
  downloadDataset: "GET:api/dataset_model_marketplace/download/:pk",
  getWebhooks: "GET:api/webhooks/",
  delWebhooks: "DELETE:api/webhooks/:id/",
  createWebhooks: "POST:api/webhooks/",
  updateWebhooks: "PATCH:api/webhooks/:id/",
  checkDockerKubernetesStatus: "GET:api/compute/docker-kubernetes-status",
  rentComputeGpu: "POST:api/compute_marketplace/gpu/rent",
  createComputeGpu: "POST:api/compute_marketplace/gpu/create",
  createBulkComputeGpu: "POST:api/compute_marketplace/gpu/bulk-create/",
  getDetailComputeByIP: "GET:api/compute_marketplace/by-ip/:ip_address",
  updateComputeTypeLocation: "POST:api/compute_marketplace/compute/type-location",
  listComputeGpu: "GET:api/compute_marketplace/gpu/list",
  createPriceGpu: "POST:api/compute_marketplace/gpu-price/create",
  bulkCreatePriceGpu: "POST:api/compute_marketplace/gpu-price/bulk-create",
  bulkUpdatePriceGpu: "PUT:api/compute_marketplace/gpu-price/bulk-update",
  getComputeDetail: "GET:api/compute_marketplace/:id/",
  updateCpuPrice: "POST:api/compute_marketplace/cpu-price/create",
  resetPassword: "POST:api/user/password-reset",
  resetPasswordConfirm: "POST:api/user/password-reset-confirm/:uidb64/:token",
  changePassword: "POST:api/user/change-password",
  deleteAccount: "DELETE:api/users/:id",
  annotationTemplate: "GET:api/annotation_template/annotation-template/:id",

  // Time working
  getComputeTimeWorking: "GET:api/compute_marketplace/time-working/:id",
  createComputeTimeWorking: "POST:api/compute_marketplace/time-working/create",
  updateComputeTimeWorking: "PUT:api/compute_marketplace/time-working/:id/",

  crawlData: "GET:api/crawl",
  getLabels: "GET:api/labels/",

  // Documents
  getDocumentList: "GET:api/documents/pages",
  getDocument: "GET:api/documents/page/:id",

  // Model Marketplace
  getModel: "GET:api/model_marketplace/:id/",
  getLikeModel: "GET:api/model_marketplace/like/:model_id",
  likeModel: "POST:api/model_marketplace/like/:model_id",
  downloadModel: "POST:api/model_marketplace/download/:model_id",
  countDownloadModel: "GET:api/model_marketplace/download/:model_id",
  calculateComputeGpu: "GET:api/compute_gpu",
  modelMarketplaceAivailable:
    "GET:api/model_marketplace/check-model-available/:id",
  installModel: "PATCH:api/model_marketplace/install-model/:id",
  downloadModelData: "GET:api/model_marketplace/dowload-model-data/:pk",
  downloadCheckpoint: "GET:api/checkpoint_model_marketplace/download/:pk",

  // Add member by email
  addMemberByEmail: "POST:api/organizations/add-member-by-email",
  // Admin Users list
  adminUsersList: "GET:api/admin/users",

  // Admin Activity list
  adminActivityList: "GET:api/activity-log",

  // Admin view current payment balance
  adminCryptoPaymentBalance: "GET:api/crypto-payment/balance",

  // Admin withdraw
  adminWithdrawCrypto: "POST:api/crypto-payment/withdraw",

  // Rewards
  userRewards: "GET:api/reward_point/user/user_action_history/",
  createUserReward: "POST:api/reward_point/user/user_action_history/",
  rewardActions: "GET:api/reward_point/",
  createRewardAction: "POST:api/reward_point/",
  updateRewardAction: "PATCH:api/reward_point/:action_id",

  // Storages
  storageTypes: "GET:api/storages/types",
  storageExportTypes: "GET:api/storages/export/types",
  storageFormData: "GET:api/storages/:type/form",
  storageExportFormData: "GET:api/storages/export/:type/form",
  createStorage: "POST:api/storages/:type",
  createExportStorage: "POST:api/storages/export/:type",
  updateStorage: "PATCH:api/storages/:type/:pk",
  updateExportStorage: "PATCH:api/storages/export/:type/:pk",
  listStorage: "GET:api/storages?project=:project",
  listExportStorage: "GET:api/storages/export?project=:project",
  importStorage: "POST:api/storages/:type/:pk/sync",
  exportStorage: "POST:api/storages/export/:type/:pk/sync",
  deleteStorage: "DELETE:api/storages/:type/:pk",
  deleteExportStorage: "DELETE:api/storages/export/:type/:pk",

  // Global Storages
  listGlobalStorage: "GET:api/storages/global",
  createGlobalStorage: "POST:api/storages/global/:type",
  updateGlobalStorage: "POST:api/storages/global/:type/:pk",
  linkGlobalStorage: "POST:api/storages/link-global/:project/:pk/:type",
  deleteGlobalStorage: "DELETE:api/storages/delete-global/:type/:pk",

  // ML
  getMlPort: "GET:api/projects/get-ml-port",
  resetMlPort: "GET:api/projects/reset-ml-port",
  mlTensorboard: "GET:api/projects/:project_id/tensorboard",
  resetMLNodes: "GET:api/ml/:id/reset",
  stopTrain: "POST:api/ml/:id/stop-train",
  startTrain: "POST:api/ml/:id/train",
  disconectNetWork: "POST:api/ml/ml-network/disconnect/:network_id",
  joinNetWork: "POST:api/ml/ml-network/join/:network_id",
  updateNetWork: "POST:api/ml/ml-network/add-compute",

  //Preference
  getComputePreference: "GET:api/compute_marketplace/computes-preference/:id",
  updateComputePreference:
    "POST:api/compute_marketplace/computes-preference-update/:id",
  deleteComputePreference:
    "DELETE:api/compute_marketplace/computes-preference-update/:id",
  postAutoMergeCard: "POST:api/compute_marketplace/auto-merge-card",
  getAutoMergeCard: "GET:api/compute_marketplace/auto-merge-card",

  //recommend price
  getRecommendPrice: "GET:api/compute_marketplace/recommend-price-card",

  // PayPal
  createPayPalOrder: "POST:api/paypal/create-order",
  capturePayPalOrder: "POST:api/paypal/capture-order",

  // new api get list computes market
  getListComputeMarket: "GET:api/compute_marketplace/list",

  // User portfolio
  getUserPortfolioByToken: "GET:api/user/portfolio",

  // Rented GPUs
  listRentedGpu: "GET:api/compute_marketplace/list-rented-card",
  deleteRentedGpu: "DELETE:api/compute_marketplace/list-rented-card/:id",
  deleteRentedGpuCrypto: "POST:api/crypto-payment/refund-order",

  // Verify email address
  verifyEmail: "POST:api/users/send_verification_email/",

  // Validate email address
  validateEmail: "POST:api/validate-email/",

  // Crawl History
  crawlHistory: "POST:api/projects/crawl-history/",

  // Computes marketplace V2
  listComputesMarketplaceV2: "POST:api/compute_marketplace/list",
  // Project labels
  addLabels: "POST:api/projects/labels/",
  removeLabel: "DELETE:api/projects/labels/",

  // Change organization membership
  changeOrganizationMembership: "PATCH:api/organizations/memberships/:id",
  // Import Dataset
  importDataset: "POST:api/import/upload-dataset",

  // Claim Task
  claimTask: "GET:projects/claim_task",

  // Release Task
  unassignTask: "POST:api/tasks/:id/unassign",

  // Commercialize my models
  commercializeModel: "POST:api/model_marketplace/commercialize-model",

  // Comments
  comments: "GET:api/comments?task=:task&ordering=-created_at",
  commentCreate: "POST:api/comments",
  commentUpdate: "PATCH:api/comments/:id",

  // Replace user in tasks
  replaceUser: "POST:api/projects/:id/replace-user",

  // Create compute self-host wait verify
  createComputeSelfHostWaitVerify:
    "POST:api/compute_marketplace/create-compute-selfhost-wait-verify/",
  checkComputeSelfHostWaitVerify:
    "GET:api/compute_marketplace/compute/selfhost/wait-verify/",

  // Models
  addModel: "POST:api/model_marketplace/add-model",
  rentedModels: "GET:api/model_marketplace/list-rent-model",
  historybuildModels: "GET:api/model_marketplace/list-build-model",
  userNotification: "GET:api/user/notification/:history_id",

  // Dashboard
  dashboardCalculate: "GET:api/compute_marketplace/dashboard/calculate",

  // Model source
  myModelSources: "GET:api/model_marketplace/list-source-model",

  deploy: "POST:api/model_marketplace/deploy-model-source/",
  deployHistory: "GET:api/ml/history-deploy-list?project=:project",

  // Test stripe
  stripeCreateIntent: "GET:api/stripe/create-intent?amount=:amount&currency=:currency",
  stripeConfirmToken: "GET:api/stripe/confirm-token?amount=:amount&currency=:currency&confirmation_token=:confirmation_token",
  stripeCapture: "GET:api/stripe/capture?paymentIntent=:paymentIntent",

  // PII Entities
  addPii: "POST:api/projects/pii",
  removePii: "DELETE:api/projects/pii",

  // Model Tasks
  modelTasks: "GET:api/model_tasks",
  addModelTasks: "POST:api/model_tasks",
  getModelTasks: "GET:api/model_tasks/:id",
  updateModelTasks: "PATCH:api/model_tasks/:id",
  deleteModelTasks: "DELETE:api/model_tasks/:id",
  assignModelTasks: "POST:api/model_marketplace_tasks/:model_id",
  unassignModelTasks: "DELETE:api/model_marketplace_tasks/:model_id",

  // Transactions
  userTransactions: "GET:api/user/transaction",

  // Orders
  adminOrders: "GET:api/orders/",

  // Workflows
  getWorkflowByProjectId: "GET:api/workflows/get-workflow",
  getWorkflowsToken: "GET:api/workflows-token",
  getWorkflowTemplates: "GET:api/workflows-listing",
  getWorkflowTemplateDetail: "GET:api/workflows-listing/:id",
  createWorkflowTemplate: "GET:api/workflows-listing/:id/create-template",
  getWorkflowTemplateCategories: "GET:api/workflows-listing/categories",
};

export default Endpoints;
