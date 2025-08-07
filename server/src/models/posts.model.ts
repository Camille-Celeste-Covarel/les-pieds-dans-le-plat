import { DataTypes, Model } from "sequelize";
import type { BelongsToManySetAssociationsMixin, Sequelize } from "sequelize";
import type {
  PostsAttributes,
  PostsCreationAttributes,
} from "../types/models/models";
import type { Tags } from "./tags.model";
import type { User } from "./user.model";

export class Posts
  extends Model<PostsAttributes, PostsCreationAttributes>
  implements PostsAttributes
{
  public id!: string;
  public user_id!: string;
  public title!: string;
  public status!: "pending_review" | "approved" | "rejected";
  public hook!: string | null;
  public is_featured!: boolean;
  public content!: string;
  public slug!: string;
  public rejection_reason!: string | null;
  public admin_context!: string | null;

  public publishedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly author?: User;
  public readonly tags?: Tags[];

  public setTags!: BelongsToManySetAssociationsMixin<Tags, number>;

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
        hook: {
          type: DataTypes.STRING(300),
          allowNull: true,
        },
        is_featured: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        content: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        publishedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        rejection_reason: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        admin_context: {
          type: DataTypes.TEXT,
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
