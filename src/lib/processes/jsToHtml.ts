import { ITemplateContent, splitCSSById } from "ap-shared-core/out/uc-control/Template.js";
import { ucUtil } from "ap-shared-core/out/uc-control/ucUtil.js";
import { parseDocument } from "htmlparser2";
import { isTag } from "domhandler";
import type { Document, Element } from "domhandler";
import { selectAll } from "css-select";
import render from "dom-serializer";
export class EModify {
    static GetHtmlElement(content: string) {
        const doc = parseDocument(content);
        const rootElements: Element[] = doc.children.filter(isTag);
        return rootElements[0];
    }
    static hasAttribute(el: Element, name: string): boolean {
        return el.attribs?.[name] !== undefined;
    }
    static getAttribute(el: Element, name: string): string | undefined {
        return el.attribs?.[name];
    }
    static querySelectorAll(doc: Element, selector: string) {
        const nodes = selectAll(selector, doc.children);
        return nodes as Element[];
    }
    static outerHTML(el: any) { return render(el as Element); }
    static nodeType(el: Element) { return getControlType(el); }
}

export function GetTemplateMetaByContent$main(htmlcontent: string, cssContent: string) {
    //let ele = ucUtil.PHP_REMOVE(htmlcontent)["#$"]() as HTMLElement;
    let rtrn = new ITemplateContent();
    let ele = EModify.GetHtmlElement(ucUtil.PHP_REMOVE(htmlcontent));

    let hasMultipleNode = !EModify.hasAttribute(ele, 'id');
    if (hasMultipleNode) {
        for (const ichild of Array.from(ele.children)) {
            let id = EModify.getAttribute(ichild as Element, 'id');
            if (id != null) {
                rtrn.templates[id] = {
                    //accessKey: id,
                    //objectKey: undefined,
                    htmlContents: ucUtil.PHP_ADD(EModify.outerHTML(ichild)),
                };

            }
        }
    } else {
        let id = EModify.getAttribute(ele as Element, 'id');
        rtrn.templates[id] = {
            // accessKey: id,
            // objectKey: undefined,
            htmlContents: ucUtil.PHP_ADD(EModify.outerHTML(ele)),
        };
    }
    let rtrnKeys = Object.keys(rtrn.templates);
    let isSimpleMode = false;
    if (rtrnKeys.length == 0) {
        rtrn.templates["primary"] = {
            //accessKey: "primary",
            //objectKey: undefined,
            htmlContents: ucUtil.PHP_ADD(EModify.outerHTML(ele)),
        };
        rtrnKeys = ["primary"];
        isSimpleMode = true;
    }
    splitCSSById(cssContent, rtrn);
    return rtrn;
}

/*
hasAttribute
getAttribute
querySelectorAll  // find all element that has attribute [x-name]
                  // find all element that has attribute [id]

                  
*/

function getControlType(el: Element): string {
    const tag = el.tagName.toLowerCase();

    switch (tag) {

        /* ===== Text / Inline ===== */
        case 'span':
            return 'HTMLSpanElement';
        case 'label':
            return 'HTMLLabelElement';
        case 'a':
            return 'HTMLAnchorElement';
        case 'strong':
        case 'em':
        case 'b':
        case 'i':
        case 'small':
            return 'HTMLElement';

        /* ===== Containers ===== */
        case 'div':
            return 'HTMLDivElement';
        case 'section':
        case 'article':
        case 'header':
        case 'footer':
        case 'main':
        case 'nav':
            return 'HTMLElement';

        /* ===== Form Controls ===== */
        case 'input':
            return resolveInputType(el);
        case 'textarea':
            return 'HTMLTextAreaElement';
        case 'select':
            return 'HTMLSelectElement';
        case 'option':
            return 'HTMLOptionElement';
        case 'button':
            return 'HTMLButtonElement';
        case 'form':
            return 'HTMLFormElement';

        /* ===== Media ===== */
        case 'img':
            return 'HTMLImageElement';
        case 'video':
            return 'HTMLVideoElement';
        case 'audio':
            return 'HTMLAudioElement';
        case 'canvas':
            return 'HTMLCanvasElement';

        /* ===== Tables ===== */
        case 'table':
            return 'HTMLTableElement';
        case 'thead':
        case 'tbody':
        case 'tfoot':
            return 'HTMLTableSectionElement';
        case 'tr':
            return 'HTMLTableRowElement';
        case 'td':
        case 'th':
            return 'HTMLTableCellElement';

        /* ===== Lists ===== */
        case 'ul':
            return 'HTMLUListElement';
        case 'ol':
            return 'HTMLOListElement';
        case 'li':
            return 'HTMLLIElement';

        /* ===== Script / Style ===== */
        case 'script':
            return 'HTMLScriptElement';
        case 'style':
            return 'HTMLStyleElement';
        case 'link':
            return 'HTMLLinkElement';
        case 'meta':
            return 'HTMLMetaElement';

        /* ===== Fallback ===== */
        default:
            // Custom UC tags like <TITLE-BAR>, <WRAPPER>, etc.
            return 'HTMLElement';
    }
}
function resolveInputType(el: Element): string {
    const type = (EModify.getAttribute(el, 'type') || 'text').toLowerCase();

    switch (type) {
        case 'checkbox':
        case 'radio':
        case 'range':
        case 'number':
        case 'date':
        case 'color':
        case 'file':
        case 'password':
        case 'email':
        case 'search':
        case 'tel':
        case 'url':
        case 'hidden':
        case 'submit':
        case 'reset':
        case 'button':
            return 'HTMLInputElement';
        default:
            return 'HTMLInputElement';
    }
}
