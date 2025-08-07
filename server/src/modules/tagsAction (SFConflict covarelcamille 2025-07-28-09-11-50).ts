import type { Request, Response, NextFunction } from "express";
import { Tags } from "../models/_index";

// --- Action pour lister tous les tags disponibles ---
const browse = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tags = await Tags.findAll({
            order: [["name", "ASC"]],
        });
        res.json(tags);
    } catch (error) {
        next(error);
    }
};

export default {
    browse,
};