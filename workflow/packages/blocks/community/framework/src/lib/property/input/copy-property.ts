import { Type } from '@sinclair/typebox';
import { BasePropertySchema, TPropertyValue } from './common';
import { PropertyType } from './property-type';

export const CopyTextProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Void(), PropertyType.COPY_TEXT),
  Type.Object({
    fieldKey: Type.Required(Type.String()),
}),
]);

export type CopyTextProperty = BasePropertySchema &
  TPropertyValue<
    undefined,
    PropertyType.COPY_TEXT,
    false
  > & {
    fieldKey: string;
  };
