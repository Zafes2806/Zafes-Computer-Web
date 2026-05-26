import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

const TinyMceEditor = lazy(async () => {
    await import('../../lib/tinymce');
    const tinyMceReactModule = await import('@tinymce/tinymce-react');

    return {
        default: tinyMceReactModule.Editor,
    };
});

function LazyTinymceEditor({ fallback, ...props }) {
    return (
        <Suspense
            fallback={fallback || (
                <div style={{ minHeight: 240, display: 'grid', placeItems: 'center' }}>
                    <Spin />
                </div>
            )}
        >
            <TinyMceEditor {...props} />
        </Suspense>
    );
}

export default LazyTinymceEditor;
