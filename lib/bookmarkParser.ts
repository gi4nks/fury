import { HTMLElement, Node, parse } from "node-html-parser";

export type ParsedBookmark = {
  url: string;
  title: string;
  description?: string;
  sourceFolder?: string;
};

export function parseBookmarksFromHtml(html: string): ParsedBookmark[] {
  const root = parse(html);
  const parsedBookmarks: ParsedBookmark[] = [];

  const rootDl = root.querySelector("dl");
  if (!rootDl) {
    return parsedBookmarks;
  }

  walkDl(rootDl, []);

  return parsedBookmarks;

  function walkDl(dlNode: HTMLElement, stack: string[]): void {
    for (const child of dlNode.childNodes) {
      if (!isHTMLElement(child)) {
        continue;
      }

      const tag = child.tagName.toUpperCase();

      if (tag === "DT") {
        const folderHeader = child.querySelector("h3");
        if (folderHeader) {
          const folderName = folderHeader.text.trim();
          const nestedDl = child.querySelector("dl");
          if (nestedDl) {
            walkDl(nestedDl, folderName ? [...stack, folderName] : stack);
          }
        }

        const anchor = child.querySelector("a");
        if (anchor) {
          addBookmark(anchor, child, stack);
        }
      } else if (tag === "DL") {
        walkDl(child, stack);
      }
    }
  }

  function addBookmark(
    anchor: HTMLElement,
    context: HTMLElement,
    folderStack: string[]
  ): void {
    const rawUrl = anchor.getAttribute("href") ?? anchor.getAttribute("HREF");
    if (!rawUrl) {
      return;
    }

    const url = rawUrl.trim();
    if (!url) {
      return;
    }

    const title = anchor.text.trim() || url;
    const description = findDescriptionSibling(context);
    const sourceFolder =
      folderStack.length > 0 ? folderStack.join(" / ") : undefined;

    parsedBookmarks.push({
      url,
      title,
      description,
      sourceFolder,
    });
  }

  function findDescriptionSibling(node: HTMLElement): string | undefined {
    let sibling = getNextElementSibling(node);
    while (sibling) {
      const tag = sibling.tagName.toUpperCase();
      if (tag === "DD") {
        const text = sibling.text.trim();
        return text || undefined;
      }
      if (tag === "DT") {
        break;
      }
      sibling = getNextElementSibling(sibling);
    }

    return undefined;
  }

  function getNextElementSibling(current: Node | null): HTMLElement | null {
    let pointer = current?.nextSibling ?? null;
    while (pointer) {
      if (isHTMLElement(pointer)) {
        return pointer;
      }
      pointer = pointer.nextSibling;
    }
    return null;
  }

  function isHTMLElement(node: Node): node is HTMLElement {
    return node instanceof HTMLElement;
  }
}
