import { DataTypes, Model, type Sequelize } from "sequelize";
import type {
  UserAttributes,
  UserCreationAttributes,
} from "../types/models/models";

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public email!: string;
  public password!: string;
  public public_name!: string;
  public avatar_url?: string;
  public is_admin!: boolean;
  public reset_token?: string | null;
  public reset_token_expiry?: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static initialize(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        password: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        public_name: {
          type: DataTypes.STRING (255 ),
          allowNull: false,
          unique: true,
        },
        avatar_url: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        is_admin: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        reset_token: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        reset_token_expiry: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: "users",
        timestamps: true,
        underscored: true,
        modelName: "User",
        indexes: [
          {
            unique: true,
            fields: ["email"],
            name: "idx_user_email_unique",
          },
          {
            fields: ["public_name"],
            name: "idx_user_public_name",
          },
          {
            fields: ["is_admin"],
            name: "idx_user_is_admin",
          },
        ],
      },
    );
  }

  // L'association est la clé pour lier les données !
  static associate(sequelize: Sequelize) {
    User.hasMany(sequelize.models.Posts, {
      foreignKey: "user_id",
      as: "posts",
    });
  }
}
