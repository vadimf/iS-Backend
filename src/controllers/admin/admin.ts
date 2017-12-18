import * as express from "express";
import { isAdministrator } from "../../config/passport";
import {default as AuthController } from "./auth/auth";
import {default as AdministratorController } from "./administrator/administrator";
import {default as UserController } from "./user/user";
import {default as NotificationsController } from "./notifications/notifications";

const router = express.Router();

router.use("/auth",                                         AuthController);
router.use("/administrator",            isAdministrator,    AdministratorController);
router.use("/user",                     isAdministrator,    UserController);
router.use("/notifications",            isAdministrator,    NotificationsController);

export default router;