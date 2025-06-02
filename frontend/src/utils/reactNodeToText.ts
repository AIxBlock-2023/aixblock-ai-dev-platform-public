import { isValidElement, ReactNode } from "react";

export function reactNodeToText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return node.toString();
  if (Array.isArray(node)) return node.map(reactNodeToText).join('');
  if (isValidElement(node)) return reactNodeToText(node.props.children);
  return '';
}
