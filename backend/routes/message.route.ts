import express, { Router } from "express";
import { userHistory, userMessage } from "../controller/message.controller.ts";
import {
	validateMessage,
	validateHistory,
} from "../validators/message.validator.ts";
import { validate } from "../middleware/validation.middleware.ts";

const msgRoute: Router = express.Router();

msgRoute.post("/message", validate(validateMessage), userMessage);
msgRoute.post("/history", validate(validateHistory), userHistory);

export { msgRoute };
