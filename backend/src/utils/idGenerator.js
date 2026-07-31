// Generates human-readable sequential IDs like AST-2026-0001 / CMP-2026-0001
const generateSequentialId = async (Model, field, prefix) => {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^${prefix}-${year}-`);
  const count = await Model.countDocuments({ [field]: regex });
  const nextNumber = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${nextNumber}`;
};

module.exports = { generateSequentialId };
