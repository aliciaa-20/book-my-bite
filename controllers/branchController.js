/**
 * Branch Management Controller
 * Module 12: Branch Management
 */

const Branch = require('../models/Branch');
const Table = require('../models/Table');

/**
 * @desc    Get all branches
 * @route   GET /api/branches
 * @access  Public
 */
const getAllBranches = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === 'true') filter.isActive = true;

    const branches = await Branch.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: 'Branches retrieved successfully',
      data: {
        count: branches.length,
        branches
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single branch by ID with summary
 * @route   GET /api/branches/:id
 * @access  Public
 */
const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: `Branch with ID ${req.params.id} not found`,
        errorCode: 'BRANCH_NOT_FOUND'
      });
    }

    const tablesCount = await Table.countDocuments({ branchId: branch._id, isActive: true });

    res.status(200).json({
      success: true,
      message: 'Branch details retrieved successfully',
      data: {
        branch,
        totalTables: tablesCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new branch
 * @route   POST /api/branches
 * @access  Private (Admin)
 */
const createBranch = async (req, res, next) => {
  try {
    const { name, address, city, phone, seatingCapacity, openingTime, closingTime } = req.body;

    const existingBranch = await Branch.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBranch) {
      return res.status(409).json({
        success: false,
        message: `Branch with name '${name}' already exists`,
        errorCode: 'BRANCH_ALREADY_EXISTS'
      });
    }

    const branch = new Branch({
      name,
      address,
      city,
      phone,
      seatingCapacity,
      openingTime: openingTime || '11:00',
      closingTime: closingTime || '23:00'
    });

    await branch.save();

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: {
        _id: branch._id,
        branch
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update branch details
 * @route   PUT /api/branches/:id
 * @access  Private (Admin/Manager)
 */
const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: `Branch with ID ${req.params.id} not found`,
        errorCode: 'BRANCH_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
      data: {
        branch
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Deactivate branch
 * @route   DELETE /api/branches/:id
 * @access  Private (Admin)
 */
const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: `Branch with ID ${req.params.id} not found`,
        errorCode: 'BRANCH_NOT_FOUND'
      });
    }

    // Soft delete / toggle active
    branch.isActive = false;
    await branch.save();

    res.status(200).json({
      success: true,
      message: 'Branch deactivated successfully',
      data: {
        id: branch._id,
        isActive: branch.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch
};
