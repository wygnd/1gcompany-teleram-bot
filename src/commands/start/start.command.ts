import {BaseCommand} from "../command.abstract";
import {BotContext} from "../../context/context.interface";
import {Bot} from "grammy";
import {EMOJIS} from "../../constants";
import {generateActionKeyboardButtons} from "../../utils";


export class StartCommand extends BaseCommand {
	constructor(bot: Bot<BotContext>) {
		super(bot);
	}

	handle() {
		this.bot.command("start", ctx => this.handleStartAction(ctx))
		this.bot.on("message", async (ctx, next) => {

			await ctx.reply("Выберите действие из кнопок снизу");

			await next();
		})
	}

	private async handleStartAction(ctx: BotContext): Promise<void> {
		ctx.session.scene = "lobby";
		await ctx.reply(`Добро пожаловать в сервис фулфилмента FirstGlobal! ${EMOJIS.GREETING}\n`, {
			reply_markup: generateActionKeyboardButtons(ctx)
		});
	}
}