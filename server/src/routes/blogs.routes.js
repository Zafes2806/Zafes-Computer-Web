const express = require('express');

const { authAdmin, authOptional } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const controllerBlogs = require('../controllers/blogs.controller');
const {
    createBlogValidation,
    updateBlogValidation,
    blogIdParamValidation,
    blogListValidation,
    blogStatusUpdateValidation,
} = require('../validators/blog.validator');

const router = express.Router();

router.post('/', authAdmin, createBlogValidation, validate, asyncHandler(controllerBlogs.createBlog));
router.put(
    '/:id',
    authAdmin,
    updateBlogValidation,
    validate,
    asyncHandler(controllerBlogs.updateBlog),
);
router.patch('/:id', authAdmin, blogStatusUpdateValidation, validate, asyncHandler(controllerBlogs.updateBlogStatus));
router.patch('/:id/restore', authAdmin, blogIdParamValidation, validate, asyncHandler(controllerBlogs.restoreBlog));

router.get('/', authOptional, blogListValidation, validate, asyncHandler(controllerBlogs.getBlogs));

router.get('/:id', authOptional, blogIdParamValidation, validate, asyncHandler(controllerBlogs.getBlogById));

router.delete(
    '/:id',
    authAdmin,
    blogIdParamValidation,
    validate,
    asyncHandler(controllerBlogs.deleteBlog),
);

module.exports = router;
