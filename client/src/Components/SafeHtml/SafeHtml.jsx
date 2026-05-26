import { createElement } from 'react';

import { sanitizeRichTextHtml } from '../../lib/sanitizeHtml';

function SafeHtml({ html, fallback = '', as: Tag = 'div', ...props }) {
    const safeHtml = sanitizeRichTextHtml(html || fallback);

    return createElement(Tag, {
        ...props,
        dangerouslySetInnerHTML: { __html: safeHtml },
    });
}

export default SafeHtml;
