import {BotContext} from "./context/context.interface";
import {Keyboard} from "grammy";
import {MAIN_BUTTONS} from "./constants";

export const hasNullableFields = (object: Object): boolean => {
	const values = Object.values(object);
	let res = false;

	values.map((v) => {
		if (!v || v === null) {
			res = true;
			return
		}

		if (typeof v === "object") {
			res = hasNullableFields(v);
		}
	})

	return res;
}


export const generateActionKeyboardButtons = (ctx: BotContext): Keyboard => {
	const keyboardButton = new Keyboard();
	const isRegisteredUser = ctx.session.alreadyRegistered;

	for (const [_, fields] of MAIN_BUTTONS) {
		const {name, needReg, deprecated, forUnRegUsers} = fields;

		if (needReg && !isRegisteredUser || deprecated || forUnRegUsers && isRegisteredUser) continue;

		keyboardButton.text(name).row();
	}

	keyboardButton.resized(true); // Close keyboard after using
	keyboardButton.persistent();
	return keyboardButton;
}
