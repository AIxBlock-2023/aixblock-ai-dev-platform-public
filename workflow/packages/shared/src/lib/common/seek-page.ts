import { TSchema, Type } from '@sinclair/typebox'
import { Nullable } from './base-model'

export type Cursor = string | null

export type SeekPage<T> = {
    next?: Cursor
    previous?: Cursor
    pageCount?: number
    data: T[]
}

export const SeekPage = (t: TSchema): TSchema => Type.Object({
    data: Type.Array(t),
    pageCount: Type.Optional(Type.Number({ description: 'Page count' })),
    next: Nullable(Type.String({ description: 'Cursor to the next page' })),
    previous: Nullable(Type.String({ description: 'Cursor to the previous page' })),
})
