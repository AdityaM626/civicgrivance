const reportService = require('../services/report.service');

const getOverview = async (req, res, next) => {
  try {
    const data = await reportService.getOverviewReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getWards = async (req, res, next) => {
  try {
    const data = await reportService.getWardWiseReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const data = await reportService.getDepartmentReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const data = await reportService.getCategoryReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const data = await reportService.getStatusReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getPriorities = async (req, res, next) => {
  try {
    const data = await reportService.getPriorityReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getSla = async (req, res, next) => {
  try {
    const data = await reportService.getSlaReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getEscalations = async (req, res, next) => {
  try {
    const data = await reportService.getEscalationReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getResolution = async (req, res, next) => {
  try {
    const data = await reportService.getResolutionReport(req.query, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const data = await reportService.getTrendReport(req.query, req.user, req.query.groupBy);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

module.exports = {
  getOverview,
  getWards,
  getDepartments,
  getCategories,
  getStatus,
  getPriorities,
  getSla,
  getEscalations,
  getResolution,
  getTrends
};
