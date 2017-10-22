import * as express from "express";
const router = express.Router();

router
    .get("/", function (req, res, next) {
        res.response({d: true});
    });

export default router;