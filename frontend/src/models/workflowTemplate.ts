export type TWorkflowTemplateModel = {
  id: string;
  name: string;
  price: number;
  description: string;
  preview: string | null;
  userId: number;
  categoryId: string;
}

export type TWorkflowTemplateCategoryModel = {
  id: string;
  name: string;
  displayName: string;
  description: number;
}
