const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getActivityCodes,
  createActivityCode,
  updateActivityCode,
  deleteActivityCode,
  bulkCreateActivityCodes,
  getMqttConfigs,
  saveMqttConfig,
  deleteMqttConfig,
  getKpiTarget,
  saveKpiTarget,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getLineProcesses,
  createLineProcess,
  updateLineProcess,
  deleteLineProcess,
} = require("../controllers/masterController");

const router = express.Router();

// Apply authMiddleware globally to all master routes
router.use(authMiddleware);

// Machines
router.get("/machines", getMachines);
router.post("/machines", createMachine);
router.put("/machines/:id", updateMachine);
router.delete("/machines/:id", deleteMachine);

// Products
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Activity Codes
router.get("/activity-codes", getActivityCodes);
router.post("/activity-codes", createActivityCode);
router.post("/activity-codes/bulk", bulkCreateActivityCodes);
router.put("/activity-codes/:id", updateActivityCode);
router.delete("/activity-codes/:id", deleteActivityCode);

// MQTT Configs
router.get("/mqtt-configs", getMqttConfigs);
router.post("/mqtt-configs", saveMqttConfig);
router.delete("/mqtt-configs/:id", deleteMqttConfig);

// KPI Targets
router.get("/kpi-targets", getKpiTarget);
router.post("/kpi-targets", saveKpiTarget);

// Employees
router.get("/employees", getEmployees);
router.post("/employees", createEmployee);
router.put("/employees/:id", updateEmployee);
router.delete("/employees/:id", deleteEmployee);

// Line Processes
router.get("/line-processes", getLineProcesses);
router.post("/line-processes", createLineProcess);
router.put("/line-processes/:id", updateLineProcess);
router.delete("/line-processes/:id", deleteLineProcess);

// ==========================================
// OEE RBAC & MENU ROUTES (API-driven)
// ==========================================
const {
  getOeeLevels,
  getOeeLevelById,
  saveOeeLevel,
  deleteOeeLevel,
  getOeeRoles,
  toggleOeeRole,
  getOeeMenus,
  getOeeMenuById,
  saveOeeMenu,
  deleteOeeMenu,
  getOeeSubmenus,
  getOeeSubmenuById,
  saveOeeSubmenu,
  deleteOeeSubmenu,
  getOeeAccessMenusByLevel,
  toggleOeeAccessMenu,
} = require("../controllers/oeeRbacController");

// OEE Levels
router.get("/oee-levels", getOeeLevels);
router.get("/oee-levels/:id", getOeeLevelById);
router.post("/oee-levels", saveOeeLevel);
router.delete("/oee-levels/:id", deleteOeeLevel);

// OEE Roles
router.get("/oee-roles", getOeeRoles);
router.post("/oee-roles/toggle", toggleOeeRole);

// OEE Menus
router.get("/oee-menus", getOeeMenus);
router.get("/oee-menus/:id", getOeeMenuById);
router.post("/oee-menus", saveOeeMenu);
router.delete("/oee-menus/:id", deleteOeeMenu);

// OEE Submenus
router.get("/oee-submenus", getOeeSubmenus);
router.get("/oee-submenus/:id", getOeeSubmenuById);
router.post("/oee-submenus", saveOeeSubmenu);
router.delete("/oee-submenus/:id", deleteOeeSubmenu);

// OEE Access Menus
router.get("/oee-access-menus/:levelId", getOeeAccessMenusByLevel);
router.post("/oee-access-menus/toggle", toggleOeeAccessMenu);

module.exports = router;
