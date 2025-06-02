import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import History from '@tiptap/extension-history';
import Mention, { MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { EditorContent, useEditor } from '@tiptap/react';
import { flowStructureUtil, isNil } from 'workflow-shared';
import './tip-tap.css';

import { useBuilderStateContext } from '../../builder-hooks';

import { textMentionUtils } from './text-input-utils';

import { piecesHooks } from '@/features/pieces/lib/blocks-hook';
import { cn } from '@/lib/utils';

type TextInputWithMentionsProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  supportUrlPrefix?: boolean;
  supportDatasetIdPrefix?: boolean;
  supportLocalPrefix?: boolean;
  propertyName?: string;
};
const extensions = (placeholder?: string) => {
  return [
    Document,
    History,
    HardBreak,
    Placeholder.configure({
      placeholder,
    }),
    Paragraph.configure({
      HTMLAttributes: {},
    }),
    Text,
    Mention.configure({
      suggestion: {
        char: '',
      },
      deleteTriggerWithBackspace: true,
      renderHTML({ node }) {
        const mentionAttrs: MentionNodeAttrs =
          node.attrs as unknown as MentionNodeAttrs;
        return textMentionUtils.generateMentionHtmlElement(mentionAttrs);
      },
    }),
  ];
};

function convertToText(value: unknown): string {
  if (isNil(value)) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return JSON.stringify(value);
}

export const TextInputWithMentions = ({
  className,
  initialValue,
  onChange,
  disabled,
  placeholder,
  supportUrlPrefix,
  supportDatasetIdPrefix,
  supportLocalPrefix,
  propertyName,
}: TextInputWithMentionsProps) => {
  const steps = useBuilderStateContext((state) =>
    flowStructureUtil.getAllSteps(state.flowVersion.trigger),
  );
  const stepsMetadata = piecesHooks
    .useStepsMetadata(steps)
    .map(({ data: metadata }, index) => {
      if (metadata) {
        return {
          ...metadata,
          stepDisplayName: steps[index].displayName,
        };
      }
      return undefined;
    });

  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler,
  );

  const insertMention = (propertyPath: string) => {
    const mentionNode = textMentionUtils.createMentionNodeFromText(
      `{{${propertyPath}}}`,
      steps,
      stepsMetadata,
    );
    editor?.chain().focus().insertContent(mentionNode).run();
  };
  const editor = useEditor({
    editable: !disabled,
    extensions: extensions(placeholder),
    content: {
      type: 'doc',
      content: textMentionUtils.convertTextToTipTapJsonContent(
        convertToText(initialValue),
        steps,
        stepsMetadata,
      ),
    },
    editorProps: {
      attributes: {
        class: cn(
          className ??
            ' w-full rounded-sm border border-input bg-background px-3 min-h-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
          textMentionUtils.inputWithMentionsCssClass,
          {
            'cursor-not-allowed opacity-50': disabled,
          },
        ),
        'data-field-id': propertyName ? propertyName : '',
      },
    },
    onUpdate: ({ editor }) => {
      const editorContent = editor.getJSON();
      const textResult =
        textMentionUtils.convertTiptapJsonToText(editorContent);
      if (onChange) {
        onChange(textResult);
      }
    },
    onFocus: () => {
      setInsertMentionHandler(insertMention);
    },
    onBlur: ({ editor }) => {
      if (!supportUrlPrefix && !supportDatasetIdPrefix && !supportLocalPrefix) {
        return;
      }

      const content = editor.getText();

      let updatedContent = content;

      if (
        content.startsWith('url:') ||
        content.startsWith('id:') ||
        content.startsWith('local:')
      ) {
        // If it already has a prefix, bypass the check
        return;
      }

      if (
        supportUrlPrefix &&
        (content.startsWith('http') || content.startsWith('https'))
      ) {
        if (!content.startsWith('url:')) {
          updatedContent = `url:${content}`;
        }
      } else if (
        supportDatasetIdPrefix &&
        /^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+$/.test(content)
      ) {
        if (!content.startsWith('id:')) {
          updatedContent = `id:${content}`;
        }
      } else if (
        supportLocalPrefix &&
        (content.includes('/') || content.includes('\\'))
      ) {
        if (!content.startsWith('local:')) {
          updatedContent = `local:${content}`;
        }
      }

      if (updatedContent !== content) {
        editor.commands.setContent(updatedContent);
        onChange(updatedContent);
      }
    },
  });
  return <EditorContent editor={editor} />;
};
