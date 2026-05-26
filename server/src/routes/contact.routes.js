const express = require('express');

const { authAdmin } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');

const controllerContact = require('../controllers/contact.controller');
const {
    createContactValidation,
    contactIdParamValidation,
    getContactsValidation,
    updateContactValidation,
} = require('../validators/contact.validator');

const router = express.Router();

router.post('/', createContactValidation, validate, asyncHandler(controllerContact.createContact));

router.get('/', authAdmin, getContactsValidation, validate, asyncHandler(controllerContact.getContacts));
router.get('/:id', authAdmin, contactIdParamValidation, validate, asyncHandler(controllerContact.getContactById));
router.patch('/:id', authAdmin, updateContactValidation, validate, asyncHandler(controllerContact.updateContact));
router.patch('/:id/restore', authAdmin, contactIdParamValidation, validate, asyncHandler(controllerContact.restoreContact));
router.delete('/:id', authAdmin, contactIdParamValidation, validate, asyncHandler(controllerContact.deleteContact));
module.exports = router;
