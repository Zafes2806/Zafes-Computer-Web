import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
    'a',
    'b',
    'blockquote',
    'br',
    'code',
    'div',
    'em',
    'figcaption',
    'figure',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'img',
    'li',
    'ol',
    'p',
    'pre',
    's',
    'span',
    'strong',
    'table',
    'tbody',
    'td',
    'th',
    'thead',
    'tr',
    'u',
    'ul',
];

const ALLOWED_ATTR = [
    'alt',
    'border',
    'cellpadding',
    'cellspacing',
    'colspan',
    'height',
    'href',
    'loading',
    'rel',
    'rowspan',
    'src',
    'style',
    'target',
    'title',
    'width',
];

export function sanitizeRichTextHtml(html) {
    if (typeof html !== 'string') {
        return '';
    }

    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS,
        ALLOWED_ATTR,
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style'],
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    });
}
