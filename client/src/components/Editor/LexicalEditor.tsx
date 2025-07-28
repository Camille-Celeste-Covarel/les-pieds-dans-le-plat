import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  type EditorState,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  KEY_DOWN_COMMAND,
  PASTE_COMMAND,
  REDO_COMMAND,
  type SerializedElementNode,
  type TextFormatType,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CodeHighlightNode, CodeNode } from "@lexical/code";
import {
  $createLinkNode,
  $isLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
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
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection";
import { getSelectedNode } from "./utils/getSelectedNode.ts";

import "./LexicalEditor.css";

function onError(error: Error) {
  console.error(error);
}

function EditablePlugin({ isEditable }: { isEditable: boolean }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(isEditable);
  }, [editor, isEditable]);

  return null;
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

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ["Arial", "Arial"],
  ["EB Garamond", "EB Garamond"],
  ["Glass Antiqua", "Glass Antiqua"],
  ["Libre Bodoni", "Libre Bodoni"],
  ["Libre Caslon Text", "Libre Caslon Text"],
  ["Montserrat", "Montserrat"],
  ["Prata", "Prata"],
  ["Questrial", "Questrial"],
  ["Verdana", "Verdana"],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ["10px", "10"],
  ["11px", "11"],
  ["12px", "12"],
  ["14px", "14"],
  ["16px", "16"],
  ["18px", "18"],
  ["20px", "20"],
  ["24px", "24"],
  ["32px", "32"],
];

const COLOR_PALETTE_MAP: Record<string, string> = {
  "var(--fondamental-color)": "Couleur principale",
  "var(--seconde-color)": "Couleur secondaire",
  "var(--tierce-color)": "Couleur tierce",
  "var(--quarte-color)": "Couleur quarte",
  "var(--quinte-color)": "Couleur quinte",
  "#000000": "Noir",
  "#E03131": "Rouge",
  "#2F9E44": "Vert",
  "#1971C2": "Bleu",
  "#F59F00": "Orange",
  "#862E9C": "Violet",
  "#495057": "Gris foncé",
  "#C2255C": "Rose",
};

const COLOR_PALETTE = Object.keys(COLOR_PALETTE_MAP);

function ToolbarPlugin({ isEditable }: { isEditable: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [fontFamily, setFontFamily] = useState<string>("Montserrat");
  const [fontSize, setFontSize] = useState<string>("16px");
  const [color, setColor] = useState<string>("#000000");

  const [isFontFamilyDropdownOpen, setIsFontFamilyDropdownOpen] =
    useState(false);
  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const fontFamilyRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorPaletteRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      // Détecter si la sélection est un lien
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      setIsLink($isLinkNode(node) || $isLinkNode(parent));

      setFontFamily(
        $getSelectionStyleValueForProperty(
          selection,
          "font-family",
          "Montserrat",
        ),
      );
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "16px"),
      );
      setColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000000"),
      );

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fontSizeRef.current &&
        !fontSizeRef.current.contains(event.target as Node)
      ) {
        setIsFontSizeDropdownOpen(false);
      }
      if (
        fontFamilyRef.current &&
        !fontFamilyRef.current.contains(event.target as Node)
      ) {
        setIsFontFamilyDropdownOpen(false);
      }
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isColorPickerOpen && colorPaletteRef.current) {
      colorPaletteRef.current.focus();
    }
  }, [isColorPickerOpen]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [editor],
  );

  const insertLink = useCallback(() => {
    if (isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = prompt("Entrez l'URL du lien :");
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    }
  }, [editor, isLink]);

  const handleFontFamilyChange = (newFont: string) => {
    applyStyleText({ "font-family": newFont });
    setIsFontFamilyDropdownOpen(false);
  };

  const handleFontSizeChange = (newSize: string) => {
    applyStyleText({ "font-size": newSize });
    setIsFontSizeDropdownOpen(false);
  };

  const handleColorChange = (newColor: string) => {
    applyStyleText({ color: newColor });
    setIsColorPickerOpen(false);
  };

  const handleFontSizeIncrement = (direction: "increment" | "decrement") => {
    const currentSize = Number.parseInt(fontSize, 10);
    let newSize = direction === "increment" ? currentSize + 1 : currentSize - 1;
    if (newSize < 8) newSize = 8;
    handleFontSizeChange(`${newSize}px`);
  };

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatBlock = useCallback(
    (type: "paragraph" | "h1" | "h2" | "quote") => {
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
    },
    [editor, blockType],
  );

  useEffect(() => {
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        if (event.ctrlKey) {
          if (event.key === "k") {
            event.preventDefault();
            insertLink();
            return true;
          }
          if (event.altKey && event.key === "1") {
            event.preventDefault();
            formatBlock("h1");
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, insertLink, formatBlock]);

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
        disabled={!canUndo || !isEditable}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        aria-label="Annuler"
        title="Annuler (Ctrl+Z)"
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
        disabled={!canRedo || !isEditable}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        aria-label="Rétablir"
        title="Rétablir (Ctrl+Y)"
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

      <div className="font-family-control" ref={fontFamilyRef}>
        <button
          type="button"
          className="font-family-display-btn"
          onClick={() => setIsFontFamilyDropdownOpen(!isFontFamilyDropdownOpen)}
          aria-haspopup="true"
          aria-expanded={isFontFamilyDropdownOpen}
          title="Police de caractères"
          style={{ fontFamily: fontFamily }}
          disabled={!isEditable}
        >
          {fontFamily}
          <i className="chevron-down" />
        </button>
        {isFontFamilyDropdownOpen && (
          <div className="font-family-dropdown">
            {FONT_FAMILY_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="font-family-item-btn"
                onClick={() => handleFontFamilyChange(value)}
                style={{ fontFamily: value }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="font-size-control" ref={fontSizeRef}>
        <button
          type="button"
          className="font-size-btn"
          onClick={() => handleFontSizeIncrement("decrement")}
          aria-label="Diminuer la taille"
          title="Diminuer la taille"
          disabled={!isEditable}
        >
          -
        </button>
        <button
          type="button"
          className="font-size-display-btn"
          onClick={() => setIsFontSizeDropdownOpen(!isFontSizeDropdownOpen)}
          aria-haspopup="true"
          aria-expanded={isFontSizeDropdownOpen}
          title="Taille de la police"
          disabled={!isEditable}
        >
          {Number.parseInt(fontSize, 10)}
        </button>
        <button
          type="button"
          className="font-size-btn"
          onClick={() => handleFontSizeIncrement("increment")}
          aria-label="Augmenter la taille"
          title="Augmenter la taille"
          disabled={!isEditable}
        >
          +
        </button>
        {isFontSizeDropdownOpen && (
          <div className="font-size-dropdown">
            {FONT_SIZE_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="font-size-item-btn"
                onClick={() => handleFontSizeChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="toolbar-divider" />

      <div className="color-picker-control" ref={colorPickerRef}>
        <button
          type="button"
          className="color-picker-display-btn"
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
          aria-haspopup="true"
          aria-expanded={isColorPickerOpen}
          aria-label="Changer la couleur du texte"
          disabled={!isEditable}
        >
          <div
            className="color-swatch-display"
            style={{ backgroundColor: color }}
          />
        </button>
        {isColorPickerOpen && (
          <div
            ref={colorPaletteRef}
            tabIndex={-1}
            className="color-palette-dropdown"
            role="toolbar"
            aria-label="Palette de couleurs"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setIsColorPickerOpen(false);
                colorPickerRef.current?.querySelector("button")?.focus();
              }
            }}
          >
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={color === c}
                className={`color-palette-swatch ${
                  color === c ? "active" : ""
                }`}
                style={{ backgroundColor: c }}
                onClick={() => handleColorChange(c)}
                aria-label={COLOR_PALETTE_MAP[c]}
                title={COLOR_PALETTE_MAP[c]}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={insertLink}
        className={isLink ? "active" : ""}
        aria-label="Insérer un lien"
        title="Insérer un lien (Ctrl+K)"
        disabled={!isEditable}
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
          <title>Insérer un lien</title>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => formatText("bold")}
        className={isBold ? "active" : ""}
        aria-label="Mettre en gras"
        title="Mettre en gras (Ctrl+B)"
        disabled={!isEditable}
      >
        <b>B</b>
      </button>
      <button
        type="button"
        onClick={() => formatText("italic")}
        className={isItalic ? "active" : ""}
        aria-label="Mettre en italique"
        title="Mettre en italique (Ctrl+I)"
        disabled={!isEditable}
      >
        <i>I</i>
      </button>
      <button
        type="button"
        onClick={() => formatText("underline")}
        className={isUnderline ? "active" : ""}
        aria-label="Souligner"
        title="Souligner (Ctrl+U)"
        disabled={!isEditable}
      >
        <u>U</u>
      </button>
      <button
        type="button"
        onClick={() => formatText("strikethrough")}
        className={isStrikethrough ? "active" : ""}
        aria-label="Barrer"
        title="Barrer"
        disabled={!isEditable}
      >
        <s>S</s>
      </button>
      <button
        type="button"
        onClick={() => formatText("code")}
        className={isCode ? "active" : ""}
        aria-label="Code en ligne"
        title="Code en ligne"
        disabled={!isEditable}
      >
        {"<>"}
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        onClick={() => formatBlock("h1")}
        className={blockType === "h1" ? "active" : ""}
        aria-label="Titre 1"
        title="Titre 1"
        disabled={!isEditable}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => formatBlock("h2")}
        className={blockType === "h2" ? "active" : ""}
        aria-label="Titre 2"
        title="Titre 2"
        disabled={!isEditable}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => formatBlock("quote")}
        className={blockType === "quote" ? "active" : ""}
        aria-label="Citation"
        title="Citation"
        disabled={!isEditable}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <title>Citation</title>
          <path d="M6 17h3l2-4V7H5v6h3l-2 4zm8 0h3l2-4V7h-6v6h3l-2 4z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => formatList("bullet")}
        className={blockType === "ul" ? "active" : ""}
        aria-label="Liste à puces"
        title="Liste à puces"
        disabled={!isEditable}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <title>Liste à puces</title>
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => formatList("number")}
        className={blockType === "ol" ? "active" : ""}
        aria-label="Liste numérotée"
        title="Liste numérotée"
        disabled={!isEditable}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <title>Liste numérotée</title>
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      </button>

      <span className="toolbar-divider" />

      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        aria-label="Aligner à gauche"
        title="Aligner à gauche"
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
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        aria-label="Centrer"
        title="Centrer"
        disabled={!isEditable}
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
          <title>Centrer</title>
          <line x1="18" y1="10" x2="6" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="18" y1="18" x2="6" y2="18" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        aria-label="Aligner à droite"
        title="Aligner à droite"
        disabled={!isEditable}
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
          <title>Aligner à droite</title>
          <line x1="21" y1="10" x2="7" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="21" y1="18" x2="7" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function ClickableLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const editorRootElement = editor.getRootElement();

    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a");

      if (link) {
        event.preventDefault();
        const url = link.getAttribute("href");
        if (url) {
          const wantsToVisit = window.confirm(
            `Vous êtes sur le point de visiter le lien suivant :\n\n${url}\n\nVoulez-vous continuer ?`,
          );
          if (wantsToVisit) {
            window.open(url, "_blank", "noopener noreferrer");
          }
        }
      }
    };

    const rootElement = editorRootElement;
    if (rootElement) {
      rootElement.addEventListener("click", onClick);
    }

    return () => {
      if (rootElement) {
        rootElement.removeEventListener("click", onClick);
      }
    };
  }, [editor]);

  return null;
}

function AutoLinkPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const urlRegExp = new RegExp(/^https?:\/\/\S+$/);

    const onPaste = (event: ClipboardEvent) => {
      const pastedText = event.clipboardData?.getData("text/plain")?.trim();

      if (pastedText && urlRegExp.test(pastedText)) {
        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            if (selection.isCollapsed()) {
              const linkNode = $createLinkNode(pastedText);
              const textNode = $createTextNode(pastedText);
              linkNode.append(textNode);
              selection.insertNodes([linkNode]);
            } else {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, pastedText);
            }
          }
        });
        return true;
      }
      return false;
    };

    return editor.registerCommand(PASTE_COMMAND, onPaste, COMMAND_PRIORITY_LOW);
  }, [editor]);

  return null;
}

export interface LexicalEditorProps {
  onChange: (editorState: string) => void;
  id?: string;
  initialContent?: string;
  isEditable?: boolean;
}

export function LexicalEditor({
  onChange,
  id,
  initialContent,
  isEditable = true,
}: LexicalEditorProps) {
  const initialConfig = useMemo(
    () => ({
      namespace: "MyEditor",
      theme: editorTheme,
      onError,
      nodes: editorNodes,
      editorState: initialContent,
      editable: isEditable,
    }),
    [initialContent, isEditable],
  );

  const handleStateChange = useCallback(
    (editorState: EditorState) => {
      const editorStateJSON = editorState.toJSON();
      const root = editorStateJSON.root;
      const firstChild = root.children[0];

      const isNonEmpty =
        root.children.length > 1 ||
        (firstChild &&
          (firstChild.type !== "paragraph" ||
            (firstChild as SerializedElementNode).children.length > 0));

      if (isNonEmpty) {
        onChange(JSON.stringify(editorStateJSON));
      } else {
        onChange("");
      }
    },
    [onChange],
  );

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`editor-container ${!isEditable ? "disabled" : ""}`}>
        <ToolbarPlugin isEditable={isEditable} />
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
          <ClickableLinkPlugin />
          <AutoLinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={handleStateChange} />
          <EditablePlugin isEditable={isEditable} />
        </div>
      </div>
    </LexicalComposer>
  );
}
