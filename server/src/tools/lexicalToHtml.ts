import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import { JSDOM } from "jsdom";
import { type Klass, type LexicalNode, ParagraphNode, TextNode } from "lexical";
import type { JSDOMGlobal } from "../types/tools/toolsTypes";

// Import des nœuds "riches" pour la conversion
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";

// La configuration de l'éditeur avec un type explicite pour plus de clarté.
const editorConfig: {
  namespace: string;
  nodes: ReadonlyArray<Klass<LexicalNode>>;
  onError: (error: Error) => void;
} = {
  namespace: "HeadlessConversion",
  nodes: [
    ParagraphNode,
    TextNode,
    HeadingNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    ListNode,
    ListItemNode,
    LinkNode,
  ],
  onError: (error: Error) => {
    console.error("Erreur interne de l'éditeur headless Lexical:", error);
  },
};

export function convertLexicalToHtml(lexicalJSON: string): string {
  const editor = createHeadlessEditor(editorConfig);

  // On caste `global` vers notre type simple et sécurisé, via `unknown`.
  // `unknown` est une étape intermédiaire qui dit à TypeScript : "Fais-moi confiance".
  const g = global as unknown as JSDOMGlobal;

  // On sauvegarde l'état précédent des propriétés globales.
  const originalWindow = g.window;
  const originalDocument = g.document;

  try {
    const dom = new JSDOM();
    // On assigne temporairement les propriétés globales nécessaires à Lexical.
    // On utilise une assertion de type pour concilier le `DOMWindow` de JSDOM avec le type `Window`.
    g.window = dom.window as unknown as Window;
    g.document = dom.window.document;

    const editorState = editor.parseEditorState(lexicalJSON);
    editor.setEditorState(editorState);

    let html = "";
    editor.getEditorState().read(() => {
      html = $generateHtmlFromNodes(editor, null);
    });

    return html;
  } catch (error) {
    console.error(
      "ERREUR CRITIQUE lors de la conversion de Lexical en HTML:",
      error,
    );
    return `<p style="color: red; font-weight: bold;">Erreur de formatage du contenu. Impossible d'afficher l'article.</p>`;
  } finally {
    // On restaure les propriétés globales pour éviter les fuites de mémoire et les effets de bord.
    g.window = originalWindow;
    g.document = originalDocument;
  }
}
