/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn("posts", "subtitle", "hook", {
        transaction,
      });

      await queryInterface.changeColumn(
        "posts",
        "hook",
        {
          type: Sequelize.STRING(300),
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "posts",
        "is_featured",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn("posts", "is_featured", {
        transaction,
      });

      await queryInterface.renameColumn("posts", "hook", "subtitle", {
        transaction,
      });

      await queryInterface.changeColumn(
        "posts",
        "subtitle",
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction },
      );
    });
  },
};
