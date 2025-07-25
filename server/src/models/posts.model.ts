import { DataTypes, Model, type Sequelize } from "sequelize";
import type {
  PostsAttributes,
  PostsCreationAttributes,
} from "../types/models/models";
import type { User } from "./user.model";

export class Posts
  extends Model<PostsAttributes, PostsCreationAttributes>
  implements PostsAttributes
{
  public id!: string;
  public user_id!: string;
  public title!: string;
  public status!: string;
  public subtitle!: string | null;
  public content!: string;
  public publishedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly author?: User;

  static initialize(sequelize: Sequelize) {
    Posts.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: "users",
            key: "id",
          },
        },
        title: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: false,
        },
        status: {
          type: DataTypes.ENUM("pending_review", "approved", "rejected"),
          allowNull: false,
          defaultValue: "pending_review",
        },
        subtitle: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "posts",
        timestamps: true,
        underscored: true,
        modelName: "Posts",
      },
    );
  }

  static associate(sequelize: Sequelize) {
    Posts.belongsTo(sequelize.models.User, {
      foreignKey: "user_id",
      as: "author",
    });

    Posts.belongsToMany(sequelize.models.Tags, {
      through: "post_tags",
      foreignKey: "post_id",
      otherKey: "tag_id",
      as: "tags",
    });
  }
}
