import {BaseCommand} from "../command.abstract";
import {Bot} from "grammy";
import {BotContext} from "../../context/context.interface";
import {MAIN_BUTTONS, MANAGER_TELEGRAM} from "../../constants";

export class HelpCommand extends BaseCommand {
	constructor(bot: Bot<BotContext>) {
		super(bot);
	}

	handle() {
		const actionName = MAIN_BUTTONS.get("help")?.name || "Нужна помощь менеджера";

		this.bot.hears(actionName, async ctx => {
			await ctx.reply("Остались вопросы? Напишите в наш совместный чат или " + `[менеджеру](t.me/${MANAGER_TELEGRAM}) `
				+ "мы всегда на связи и готовы помочь", {
				parse_mode: "Markdown"
			});
		});
	}
}