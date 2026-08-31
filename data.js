// database/data.js

const users = new Map();
const groups = new Map();

/* =========================
   👤 USER DATABASE
========================= */

export function getUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      name: "",
      registered: true,
      joinedAt: Date.now()
    });
  }

  return users.get(userId);
}

export function saveUser(userId, data) {
  const user = getUser(userId);

  users.set(userId, {
    ...user,
    ...data
  });

  return users.get(userId);
}

/* =========================
   👥 GROUP DATABASE
========================= */

export function getGroup(groupId) {
  if (!groups.has(groupId)) {
    groups.set(groupId, {
      id: groupId,
      welcome: false,
      goodbye: false,
      antilink: false,
      antispam: false
    });
  }

  return groups.get(groupId);
}

export function saveGroup(groupId, data) {
  const group = getGroup(groupId);

  groups.set(groupId, {
    ...group,
    ...data
  });

  return groups.get(groupId);
}

/* =========================
   📊 DATABASE HELPERS
========================= */

export function getAllUsers() {
  return [...users.values()];
}

export function getAllGroups() {
  return [...groups.values()];
}

export function userExists(userId) {
  return users.has(userId);
}

export function groupExists(groupId) {
  return groups.has(groupId);
}

/* =========================
   📤 DEFAULT EXPORT
========================= */

export default {
  getUser,
  saveUser,
  getGroup,
  saveGroup,
  getAllUsers,
  getAllGroups,
  userExists,
  groupExists
};
