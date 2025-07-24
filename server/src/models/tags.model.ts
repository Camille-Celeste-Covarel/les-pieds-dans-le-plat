import { DataTypes, Model, type Sequelize } from "sequelize";
import type {
    tagsAttributes,
    tagsCreationAttributes,
} from "../types/models/models";

export class Tags
    extends Model<tagsAttributes, tagsCreationAttributes>
    implements tagsAttributes
{
    public id!: number;
    public name!: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static initialize(sequelize: Sequelize) {
        Tags.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING(32),
                    allowNull: false,
                    unique: true,
                },
            },
            {
                sequelize,
                tableName: "tags",
                timestamps: true,
                underscored: true,
                modelName: "Tags",
            },
        );
    }

    static associate(sequelize: Sequelize) {
        Tags.belongsToMany(sequelize.models.Posts, {
            through: "post_tags",
            foreignKey: "tag_id",
            otherKey: "post_id",
            as: "posts",
        });    }
}
