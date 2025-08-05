import {NextFunction} from "grammy";
import {MAIN_BUTTONS} from "../constants";
import {BotContext} from "../context/context.interface";

export async function sceneListenerMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
	const message = ctx.msg?.text;

	if (!message) return;

	MAIN_BUTTONS.forEach(btnFields => {
		const {name, scene} = btnFields;
		if (message.localeCompare(name) === 0) {
			ctx.session.scene = scene;
		}
	})

	await next();
}