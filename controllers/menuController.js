/**
 * Menu Management Controller
 * Module 2: Menu Management
 */

const MenuItem = require('../models/MenuItem');
const { MENU_CATEGORIES } = require('../config/constants');

/**
 * @desc    Get menu items with filters (branch, category, search, veg)
 * @route   GET /api/menu
 * @access  Public
 */
const getMenu = async (req, res, next) => {
  try {
    const { branchId, category, isVeg, isAvailable, search } = req.query;

    const filter = {};

    // Match branch or global items
    if (branchId) {
      filter.$or = [{ branchId: branchId }, { branchId: null }];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (isVeg !== undefined && isVeg !== '') {
      filter.isVeg = isVeg === 'true';
    }

    if (isAvailable !== undefined && isAvailable !== '') {
      filter.isAvailable = isAvailable === 'true';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { dietaryTags: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await MenuItem.find(filter)
      .populate('branchId', 'name city')
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully',
      data: {
        count: items.length,
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single menu item by ID
 * @route   GET /api/menu/:id
 * @access  Public
 */
const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id).populate('branchId', 'name city');
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Menu item with ID ${req.params.id} not found`,
        errorCode: 'ITEM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item retrieved successfully',
      data: {
        item
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new menu item
 * @route   POST /api/menu
 * @access  Private (Manager, Admin)
 */
const createMenuItem = async (req, res, next) => {
  try {
    const { branchId, name, category, price, description, isVeg, preparationTime, dietaryTags, image } = req.body;

    const item = new MenuItem({
      branchId: branchId || null,
      name,
      category,
      price,
      description: description || '',
      isVeg: isVeg !== undefined ? isVeg : true,
      preparationTime: preparationTime || 15,
      dietaryTags: Array.isArray(dietaryTags) ? dietaryTags : (dietaryTags ? [dietaryTags] : []),
      image: image || ''
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: {
        _id: item._id,
        item
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update menu item
 * @route   PUT /api/menu/:id
 * @access  Private (Manager, Admin)
 */
const updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Menu item with ID ${req.params.id} not found`,
        errorCode: 'ITEM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: {
        item
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle menu item availability
 * @route   PATCH /api/menu/:id/toggle-availability
 * @access  Private (Kitchen, Manager, Admin)
 */
const toggleAvailability = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Menu item with ID ${req.params.id} not found`,
        errorCode: 'ITEM_NOT_FOUND'
      });
    }

    item.isAvailable = req.body.isAvailable !== undefined ? req.body.isAvailable : !item.isAvailable;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Menu item availability set to ${item.isAvailable}`,
      data: {
        _id: item._id,
        name: item.name,
        isAvailable: item.isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete menu item
 * @route   DELETE /api/menu/:id
 * @access  Private (Manager, Admin)
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Menu item with ID ${req.params.id} not found`,
        errorCode: 'ITEM_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
      data: {
        _id: item._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get menu categories list
 * @route   GET /api/menu/categories
 * @access  Public
 */
const getCategories = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Categories retrieved successfully',
    data: {
      categories: MENU_CATEGORIES
    }
  });
};

module.exports = {
  getMenu,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  getCategories
};
