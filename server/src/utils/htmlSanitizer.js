const sanitizeHtml = require('sanitize-html');

const allowedTags = [
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

const blockTags = ['div', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'p', 'td', 'th'];

const allowedStyleProperties = {
    'text-align': [/^(left|right|center|justify)$/],
    'vertical-align': [/^(baseline|sub|super|top|text-top|middle|bottom|text-bottom)$/],
};

function sanitizeRichTextHtml(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return sanitizeHtml(value.trim(), {
        allowedTags,
        allowedAttributes: {
            a: ['href', 'name', 'rel', 'target', 'title'],
            img: ['alt', 'height', 'loading', 'src', 'title', 'width'],
            table: ['border', 'cellpadding', 'cellspacing'],
            td: ['colspan', 'rowspan', 'style'],
            th: ['colspan', 'rowspan', 'style'],
            ...Object.fromEntries(blockTags.map((tag) => [tag, ['style']])),
        },
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        allowedSchemesByTag: {
            img: ['http', 'https'],
        },
        allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
        allowProtocolRelative: false,
        allowedStyles: Object.fromEntries(blockTags.map((tag) => [tag, allowedStyleProperties])),
        parseStyleAttributes: true,
        transformTags: {
            a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
            img: sanitizeHtml.simpleTransform('img', { loading: 'lazy' }, true),
        },
        disallowedTagsMode: 'discard',
    });
}

function hasMeaningfulRichText(value) {
    const sanitized = sanitizeRichTextHtml(value);
    const text = sanitizeHtml(sanitized, { allowedTags: [], allowedAttributes: {} }).trim();
    return text.length > 0 || /<img\s/i.test(sanitized);
}

module.exports = {
    hasMeaningfulRichText,
    sanitizeRichTextHtml,
};
