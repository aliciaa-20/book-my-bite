/**
 * Branch Management Routes
 * Module 12: Branch Management
 */

const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, branchRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public routes
router.get('/', branchController.getAllBranches);
router.get('/:id', branchController.getBranchById);

// Admin & Manager routes
router.post('/', verifyAuth, authorizeRoles(ROLES.ADMIN), branchRules, validate, branchController.createBranch);
router.put('/:id', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), branchController.updateBranch);
router.delete('/:id', verifyAuth, authorizeRoles(ROLES.ADMIN), branchController.deleteBranch);

module.exports = router;
