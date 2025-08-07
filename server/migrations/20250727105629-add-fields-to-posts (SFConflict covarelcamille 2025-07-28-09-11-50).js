/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn("posts", "slug", {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      }),
      queryInterface.addColumn("posts", "rejection_reason", {
        type: Sequelize.TEXT,
        allowNull: true,
      }),
      queryInterface.addColumn("posts", "admin_context", {
        type: Sequelize.TEXT,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn("posts", "slug"),
      queryInterface.removeColumn("posts", "rejection_reason"),
      queryInterface.removeColumn("posts", "admin_context"),
    ]);
  },
};