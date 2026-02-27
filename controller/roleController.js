const Role = require("../model/roleModel.js");

// 1. Create a basic Role
exports.createRole = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole)
      return res.status(400).json({ message: "Role already exists" });

    const newRole = new Role({
      name,
      description,
      permissions: [],
    });

    await newRole.save();
    res.status(201).json({ message: "Role created", data: newRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. Update/Assign Permissions to a Role
exports.updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body;
    // 'permissions' should be an array of objects:
    // [{ resourceId, canView, canCreate, canEdit, canDelete }]

    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      { permissions },
      { new: true },
    ).populate("permissions.resourceId"); // Populate to see page details in response

    if (!updatedRole)
      return res.status(404).json({ message: "Role not found" });

    res.status(200).json({ message: "Permissions updated", data: updatedRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get all Roles (to show in a management list)
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
