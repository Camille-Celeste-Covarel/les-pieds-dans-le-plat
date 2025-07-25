import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  type EditorState,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  type TextFormatType,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useState } from "react";

// --- Imports des composants et plugins Lexical ---
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import {
  $isListItemNode,
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";

import "./LexicalEditor.css";

// --- Configuration partagée ---

function onError(error: Error) {
  console.error(error);
}

const editorTheme = {
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
  },
  quote: "editor-quote",
  list: {
    ul: "editor-list-ul",
    ol: "editor-list-ol",
    listitem: "editor-list-item",
  },
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    code: "editor-text-code",
  },
  code: "editor-code",
  paragraph: "editor-paragraph",
};

const editorNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
];

// --- Barre d'outils améliorée ---

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  // États pour les types de bloc
  const [blockType, setBlockType] = useState("paragraph");
  // États pour Annuler/Rétablir
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      // Gérer les styles de texte (gras, italique...)
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Gérer le type de bloc (titre, paragraphe, citation...)
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isHeadingNode(element)) {
        setBlockType(element.getTag());
      } else if ($isQuoteNode(element)) {
        setBlockType("quote");
      } else if ($isListItemNode(element)) {
        const parentList = element.getParent();
        if ($isListNode(parentList)) {
          setBlockType(parentList.getTag());
        }
      } else {
        setBlockType("paragraph");
      }
    });
  }, [editor]);

  useEffect(() => {
    const unregisterUpdate = editor.registerUpdateListener(updateToolbar);

    const unregisterCanUndo = editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    const unregisterCanRedo = editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    return () => {
      unregisterUpdate();
      unregisterCanUndo();
      unregisterCanRedo();
    };
  }, [editor, updateToolbar]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatBlock = (type: "paragraph" | "h1" | "h2" | "quote") => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (blockType === type && type !== "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
          return;
        }

        if (type === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else if (type === "quote") {
          $setBlocksType(selection, () => $createQuoteNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(type));
        }
      }
    });
  };

  const formatList = (type: "bullet" | "number") => {
    if (type === "bullet") {
      if (blockType !== "ul") {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    } else {
      if (blockType !== "ol") {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    }
  };

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        aria-label="Annuler"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Annuler</title>
          <polyline points="9 14 4 9 9 4" />
          <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        aria-label="Rétablir"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Rétablir</title>
          <polyline points="15 14 20 9 15 4" />
          <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
        </svg>
      </button>

      <span className="toolbar-divider" />

      {/* Styles de texte */}
      <button
        type="button"
        onClick={() => formatText("bold")}
        className={isBold ? "active" : ""}
        aria-label="Mettre en gras"
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => formatText("italic")}
        className={isItalic ? "active" : ""}
        aria-label="Mettre en italique"
      >
        <i>I</i>
      </button>
      <button
        type="button"
        onClick={() => formatText("underline")}
        className={isUnderline ? "active" : ""}
        aria-label="Souligner"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => formatText("strikethrough")}
        className={isStrikethrough ? "active" : ""}
        aria-label="Barrer"
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => formatText("code")}
        className={isCode ? "active" : ""}
        aria-label="Code en ligne"
      >
        {"<>"}
      </button>

      <span className="toolbar-divider" />

      {/* Types de blocs */}
      <button
        type="button"
        onClick={() => formatBlock("h1")}
        className={blockType === "h1" ? "active" : ""}
        aria-label="Titre 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => formatBlock("h2")}
        className={blockType === "h2" ? "active" : ""}
        aria-label="Titre 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => formatBlock("quote")}
        className={blockType === "quote" ? "active" : ""}
        aria-label="Citation"
      >
        Quote
      </button>
      <button
        type="button"
        onClick={() => formatList("bullet")}
        className={blockType === "ul" ? "active" : ""}
        aria-label="Liste à puces"
      >
        UL
      </button>
      <button
        type="button"
        onClick={() => formatList("number")}
        className={blockType === "ol" ? "active" : ""}
        aria-label="Liste numérotée"
      >
        OL
      </button>

      <span className="toolbar-divider" />

      {/* Alignement */}
      <button
        type="button"
        onClick={() =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
        }
        aria-label="Aligner à gauche"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <title>Aligner à gauche</title>
          <line x1="17" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="17" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="3" y2="18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
        }
        aria-label="Centrer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <title>Centrer</title>
          <line x1="18" y1="10" x2="6" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="18" y1="18" x2="6" y2="18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
        }
        aria-label="Aligner à droite"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <title>Aligner à droite</title>
          <line x1="21" y1="10" x2="7" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="7" y2="18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
        }
        aria-label="Justifier"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <title>Justifier</title>
          <line x1="21" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="3" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// --- Composant principal de l'éditeur ---
interface LexicalEditorProps {
  onChange: (editorState: string) => void;
  id?: string;
}

export function LexicalEditor({ onChange, id }: LexicalEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: "MyEditor",
      theme: editorTheme,
      onError,
      nodes: editorNodes,
    }),
    [],
  );

  const handleStateChange = useCallback(
    (editorState: EditorState) => {
      const editorStateJSON = JSON.stringify(editorState.toJSON());
      onChange(editorStateJSON);
    },
    [onChange],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="editor-input" id={id} />
            }
            placeholder={
              <div className="editor-placeholder">
                Commencez à écrire votre histoire...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={handleStateChange} />
        </div>
      </div>
    </LexicalComposer>
  );
}