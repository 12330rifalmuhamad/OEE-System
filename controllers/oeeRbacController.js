const { db } = require("../lib/db");

// ==========================================
// 1. OEE LEVELS CRUD
// ==========================================

async function getOeeLevels(req, res) {
  try {
    const levels = await db.oeeLevel.findMany({
      orderBy: { id: "asc" },
    });
    return res.json({ levels });
  } catch (error) {
    console.error("GET OeeLevels Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data level OEE." });
  }
}

async function getOeeLevelById(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    const level = await db.oeeLevel.findUnique({
      where: { id: idInt },
    });
    if (!level) {
      return res.status(404).json({ error: "Level tidak ditemukan." });
    }
    return res.json({ level });
  } catch (error) {
    console.error("GET OeeLevelById Error:", error);
    return res.status(500).json({ error: "Gagal mengambil detail level OEE." });
  }
}

async function saveOeeLevel(req, res) {
  try {
    const { id, name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Nama level wajib diisi." });
    }

    let level;
    if (id) {
      const idInt = parseInt(id, 10);
      level = await db.oeeLevel.upsert({
        where: { id: idInt },
        update: { name },
        create: { id: idInt, name },
      });
    } else {
      level = await db.oeeLevel.create({
        data: { name },
      });
    }

    return res.json({ message: "Level OEE berhasil disimpan.", level });
  } catch (error) {
    console.error("SAVE OeeLevel Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan level OEE." });
  }
}

async function deleteOeeLevel(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    await db.oeeLevel.delete({
      where: { id: idInt },
    });
    return res.json({ message: "Level OEE berhasil dihapus." });
  } catch (error) {
    console.error("DELETE OeeLevel Error:", error);
    return res.status(500).json({ error: "Gagal menghapus level OEE." });
  }
}

// ==========================================
// 2. OEE ROLES CRUD (USER ROLES)
// ==========================================

async function getOeeRoles(req, res) {
  try {
    const roles = await db.oeeRole.findMany({
      orderBy: { id: "asc" },
    });
    return res.json({ roles });
  } catch (error) {
    console.error("GET OeeRoles Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data role OEE." });
  }
}

async function toggleOeeRole(req, res) {
  try {
    const { userId, levelId } = req.body;
    if (!userId || !levelId) {
      return res.status(400).json({ error: "User ID dan Level ID wajib diisi." });
    }

    const userIdInt = parseInt(userId, 10);
    const levelIdInt = parseInt(levelId, 10);

    const existingRole = await db.oeeRole.findFirst({
      where: {
        userId: userIdInt,
        levelId: levelIdInt,
      },
    });

    let role = null;
    if (existingRole) {
      await db.oeeRole.delete({
        where: { id: existingRole.id },
      });
    } else {
      role = await db.oeeRole.create({
        data: {
          userId: userIdInt,
          levelId: levelIdInt,
        },
      });
    }

    return res.json({
      message: existingRole ? "Role berhasil dihapus." : "Role berhasil ditambahkan.",
      role,
    });
  } catch (error) {
    console.error("TOGGLE OeeRole Error:", error);
    return res.status(500).json({ error: "Gagal merubah role OEE user." });
  }
}

// ==========================================
// 3. OEE MENUS CRUD
// ==========================================

async function getOeeMenus(req, res) {
  try {
    const menus = await db.oeeMenu.findMany({
      include: { submenus: true },
      orderBy: { sorter: "asc" },
    });
    return res.json({ menus });
  } catch (error) {
    console.error("GET OeeMenus Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data menu OEE." });
  }
}

async function getOeeMenuById(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    const menu = await db.oeeMenu.findUnique({
      where: { id: idInt },
      include: { submenus: true },
    });
    if (!menu) {
      return res.status(404).json({ error: "Menu tidak ditemukan." });
    }
    return res.json({ menu });
  } catch (error) {
    console.error("GET OeeMenuById Error:", error);
    return res.status(500).json({ error: "Gagal mengambil detail menu OEE." });
  }
}

async function saveOeeMenu(req, res) {
  try {
    const { id, name, icon, isActive, sorter } = req.body;
    if (!name || sorter === undefined) {
      return res.status(400).json({ error: "Nama menu dan sorter wajib diisi." });
    }

    const isActiveInt = parseInt(isActive, 10) || 1;
    const sorterInt = parseInt(sorter, 10) || 0;

    let menu;
    if (id) {
      const idInt = parseInt(id, 10);
      menu = await db.oeeMenu.upsert({
        where: { id: idInt },
        update: {
          name,
          icon: icon || null,
          isActive: isActiveInt,
          sorter: sorterInt,
        },
        create: {
          id: idInt,
          name,
          icon: icon || null,
          isActive: isActiveInt,
          sorter: sorterInt,
        },
      });
    } else {
      menu = await db.oeeMenu.create({
        data: {
          name,
          icon: icon || null,
          isActive: isActiveInt,
          sorter: sorterInt,
        },
      });
    }

    return res.json({ message: "Menu OEE berhasil disimpan.", menu });
  } catch (error) {
    console.error("SAVE OeeMenu Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan menu OEE." });
  }
}

async function deleteOeeMenu(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    await db.oeeMenu.delete({
      where: { id: idInt },
    });
    return res.json({ message: "Menu OEE berhasil dihapus." });
  } catch (error) {
    console.error("DELETE OeeMenu Error:", error);
    return res.status(500).json({ error: "Gagal menghapus menu OEE." });
  }
}

// ==========================================
// 4. OEE SUBMENUS CRUD
// ==========================================

async function getOeeSubmenus(req, res) {
  try {
    const submenus = await db.oeeSubmenu.findMany({
      include: { menu: true },
      orderBy: { sorter: "asc" },
    });
    return res.json({ submenus });
  } catch (error) {
    console.error("GET OeeSubmenus Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data submenu OEE." });
  }
}

async function getOeeSubmenuById(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    const submenu = await db.oeeSubmenu.findUnique({
      where: { id: idInt },
      include: { menu: true },
    });
    if (!submenu) {
      return res.status(404).json({ error: "Submenu tidak ditemukan." });
    }
    return res.json({ submenu });
  } catch (error) {
    console.error("GET OeeSubmenuById Error:", error);
    return res.status(500).json({ error: "Gagal mengambil detail submenu OEE." });
  }
}

async function saveOeeSubmenu(req, res) {
  try {
    const { id, menuId, name, url, route, icon, isActive, sorter } = req.body;
    if (!menuId || !name || sorter === undefined) {
      return res.status(400).json({ error: "Menu parent, nama submenu, dan sorter wajib diisi." });
    }

    const menuIdInt = parseInt(menuId, 10);
    const isActiveInt = parseInt(isActive, 10) || 1;
    const sorterInt = parseInt(sorter, 10) || 0;

    let submenu;
    if (id) {
      const idInt = parseInt(id, 10);
      submenu = await db.oeeSubmenu.upsert({
        where: { id: idInt },
        update: {
          menuId: menuIdInt,
          name,
          url: url || null,
          route: route || null,
          icon: icon || null,
          isActive: isActiveInt,
          sorter: sorterInt,
        },
        create: {
          id: idInt,
          menuId: menuIdInt,
          name,
          url: url || null,
          route: route || null,
          icon: icon || null,
          isActive: isActiveInt,
          sorter: sorterInt,
        },
      });
    } else {
      submenu = await db.oeeSubmenu.create({
        data: {
          menuId: menuIdInt,
          name,
          url: url || null,
          route: route || null,
          icon: icon || null,
          isActive: isActiveInt,
          sorter: sorterInt,
        },
      });
    }

    return res.json({ message: "Submenu OEE berhasil disimpan.", submenu });
  } catch (error) {
    console.error("SAVE OeeSubmenu Error:", error);
    return res.status(500).json({ error: "Gagal menyimpan submenu OEE." });
  }
}

async function deleteOeeSubmenu(req, res) {
  try {
    const idInt = parseInt(req.params.id, 10);
    await db.oeeSubmenu.delete({
      where: { id: idInt },
    });
    return res.json({ message: "Submenu OEE berhasil dihapus." });
  } catch (error) {
    console.error("DELETE OeeSubmenu Error:", error);
    return res.status(500).json({ error: "Gagal menghapus submenu OEE." });
  }
}

// ==========================================
// 5. OEE ACCESS MENUS CRUD
// ==========================================

async function getOeeAccessMenusByLevel(req, res) {
  try {
    const levelIdInt = parseInt(req.params.levelId, 10);
    const accessMenus = await db.oeeAccessMenu.findMany({
      where: { levelId: levelIdInt },
    });
    return res.json({ accessMenus });
  } catch (error) {
    console.error("GET OeeAccessMenus Error:", error);
    return res.status(500).json({ error: "Gagal mengambil data akses menu." });
  }
}

async function toggleOeeAccessMenu(req, res) {
  try {
    const { levelId, menuId } = req.body;
    if (!levelId || !menuId) {
      return res.status(400).json({ error: "Level ID dan Menu ID wajib diisi." });
    }

    const levelIdInt = parseInt(levelId, 10);
    const menuIdInt = parseInt(menuId, 10);

    const existingAccess = await db.oeeAccessMenu.findFirst({
      where: {
        levelId: levelIdInt,
        menuId: menuIdInt,
      },
    });

    let access = null;
    if (existingAccess) {
      await db.oeeAccessMenu.delete({
        where: { id: existingAccess.id },
      });
    } else {
      access = await db.oeeAccessMenu.create({
        data: {
          levelId: levelIdInt,
          menuId: menuIdInt,
        },
      });
    }

    return res.json({
      message: existingAccess ? "Akses menu dicabut." : "Akses menu diberikan.",
      access,
    });
  } catch (error) {
    console.error("TOGGLE OeeAccessMenu Error:", error);
    return res.status(500).json({ error: "Gagal merubah akses menu OEE." });
  }
}

module.exports = {
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
};
