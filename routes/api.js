const express = require('express');
const memberController = require('../controllers/memberController');
const authController = require('../controllers/authController');
const dataController = require('../controllers/dataController');
const { requireAuth } = require('../middleware/auth');
const { validateMember, validateLogin, validateAdminUpdate, runValidation } = require('../middleware/validation');

const router = express.Router();

router.post('/auth/login', validateLogin, runValidation, authController.login);
router.post('/auth/logout', requireAuth, authController.logout);

router.get('/members/check-callsign', memberController.checkCallsign);
router.get('/members', memberController.getMembers);
router.post('/members', requireAuth, validateMember, runValidation, memberController.createMember);
router.put('/members/:id', requireAuth, validateMember, runValidation, memberController.updateMember);
router.delete('/members/:id', requireAuth, memberController.deleteMember);

router.get('/admin', requireAuth, authController.getAdminInfo);
router.put('/admin', requireAuth, validateAdminUpdate, runValidation, authController.updateAdmin);

router.get('/data/export', requireAuth, dataController.exportAll);
router.get('/data/export/members', requireAuth, dataController.exportMembers);
router.post('/data/import', requireAuth, dataController.importData);

module.exports = router;
