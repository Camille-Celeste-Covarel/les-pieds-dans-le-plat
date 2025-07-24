import { DataTypes, Model, type Sequelize } from "sequelize";
import type {
    post_tags_Attributes,
    post_tags_CreationAttributes,
} from "../types/models/models";

export class Post_Tags
    extends Model<post_tags_Attributes, post_tags_CreationAttributes>
    implements post_tags_Attributes
{
    public post_id!: string;
    public tag_id!: number;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    static initialize(sequelize: Sequelize) {
        Post_Tags.init(
            {
                post_id: {
                    type: DataTypes.UUID,
                    primaryKey: true,
                    allowNull: false,
                    references: {
                        model: 'posts',
                        key: 'id'
                    }
                },
                tag_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    references: {
                        model: 'tags',
                        key: 'id'
                    }
                },
            },
            {
                sequelize,
                tableName: "post_tags",
                timestamps: true,
                underscored: true,
                modelName: "Post_Tags",
            },
        );
    }

    static associate(sequelize: Sequelize) {
    // non néccésaire
    }
}
