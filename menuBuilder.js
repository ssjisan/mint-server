const Resource = require("./model/resourceModel.js");

const buildMenuTree = (resources, permissions) => {
  const menu = [];

  // 1. Create a map of resources for quick access
  const resourceMap = {};
  resources.forEach((res) => {
    // Find the permission for this specific resource
    const perm = permissions.find(
      (p) => p.resourceId.toString() === res._id.toString(),
    );

    if (perm && perm.canView) {
      resourceMap[res._id] = {
        ...res._doc,
        permissions: {
          create: perm.canCreate,
          edit: perm.canEdit,
          delete: perm.canDelete,
        },
        children: [],
      };
    }
  });

  // 2. Build the tree
  resources.forEach((res) => {
    const node = resourceMap[res._id];
    if (node) {
      if (node.parentId === null) {
        // Top level
        menu.push(node);
      } else if (resourceMap[node.parentId]) {
        // Has a parent and parent is authorized
        resourceMap[node.parentId].children.push(node);
      }
    }
  });

  // 3. Sort by 'order'
  return menu.sort((a, b) => a.order - b.order);
};

module.exports = buildMenuTree;
