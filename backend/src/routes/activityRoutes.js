const express = require("express");
const ActivityLog = require("../models/activityLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get activity logs with filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      user_id,
      action,
      resource,
      start_date,
      end_date,
      period // 'today', 'yesterday', '7days', 'all'
    } = req.query;

    // Set date filters based on period
    let startDate = start_date;
    let endDate = end_date;

    if (period) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (period) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case 'yesterday':
          const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
          startDate = yesterday.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case '7days':
          const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = sevenDaysAgo.toISOString().split('T')[0];
          break;
      }
    }

    // Role-based filtering: non-admin users can only see their own activities
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    const filterUserId = isAdmin ? user_id : req.user.id;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      user_id: filterUserId,
      action,
      resource,
      start_date: startDate,
      end_date: endDate
    };

    const result = await ActivityLog.findAll(options);

    res.status(200).json({
      success: true,
      message: 'Activity logs retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get activity log by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const log = await ActivityLog.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found'
      });
    }

    // Check if user can access this log
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isAdmin && log.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Activity log retrieved successfully',
      data: { log }
    });
  } catch (error) {
    console.error('Get activity log by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;