import { TAG_COLOR } from './tagPalette';

export const CONTACT_STATUS_META = Object.freeze({
    new: { label: 'Mới', color: TAG_COLOR.pending },
    contacted: { label: 'Đã liên hệ', color: TAG_COLOR.info },
    resolved: { label: 'Đã xử lý', color: TAG_COLOR.success },
    archived: { label: 'Lưu trữ', color: TAG_COLOR.accent },
    deleted: { label: 'Thùng rác', color: TAG_COLOR.danger },
});

export const BLOG_STATUS_META = Object.freeze({
    draft: { label: 'Bản nháp', color: TAG_COLOR.pending },
    published: { label: 'Đã xuất bản', color: TAG_COLOR.success },
    archived: { label: 'Lưu trữ', color: TAG_COLOR.accent },
    deleted: { label: 'Thùng rác', color: TAG_COLOR.danger },
});

export const REVIEW_STATUS_META = Object.freeze({
    pending: { label: 'Chờ duyệt', color: TAG_COLOR.pending },
    approved: { label: 'Đã duyệt', color: TAG_COLOR.success },
    hidden: { label: 'Đã ẩn', color: TAG_COLOR.warning },
    deleted: { label: 'Thùng rác', color: TAG_COLOR.danger },
});

export const CONTACT_STATUS_OPTIONS = Object.freeze([
    { value: 'new', label: 'Mới' },
    { value: 'contacted', label: 'Đã liên hệ' },
    { value: 'resolved', label: 'Đã xử lý' },
    { value: 'archived', label: 'Lưu trữ' },
]);

export const BLOG_STATUS_OPTIONS = Object.freeze([
    { value: 'draft', label: 'Bản nháp' },
    { value: 'published', label: 'Đã xuất bản' },
    { value: 'archived', label: 'Lưu trữ' },
]);

export const REVIEW_STATUS_OPTIONS = Object.freeze([
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'hidden', label: 'Đã ẩn' },
]);

export function getStatusOptionsByAvailability(options, availableValues = []) {
    if (!Array.isArray(availableValues) || availableValues.length === 0) {
        return [];
    }

    return options.filter((option) => availableValues.includes(option.value));
}
