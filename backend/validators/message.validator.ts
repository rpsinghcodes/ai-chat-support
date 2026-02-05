import { body } from "express-validator";

export const validateMessage = [
	body("sessionId")
		.trim()
		.notEmpty()
		.withMessage("Session ID is required")
		.isString()
		.withMessage("Session ID must be a string")
		.isLength({ min: 1, max: 200 })
		.withMessage("Session ID must be between 1 and 200 characters"),

	body("message")
		.trim()
		.notEmpty()
		.withMessage("Message is required")
		.isString()
		.withMessage("Message must be a string")
		.isLength({ min: 1, max: 5000 })
		.withMessage("Message must be between 1 and 5000 characters"),
];

export const validateHistory = [
	body("sessionId")
		.trim()
		.notEmpty()
		.withMessage("Session ID is required")
		.isString()
		.withMessage("Session ID must be a string")
		.isLength({ min: 1, max: 200 })
		.withMessage("Session ID must be between 1 and 200 characters"),
];
