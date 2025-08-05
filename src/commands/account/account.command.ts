import {BaseCommand} from "../command.abstract";
import {BotContext} from "../../context/context.interface";
import {Bot} from "grammy";
import {MAIN_BUTTONS} from "../../constants";

export class AccountCommand extends BaseCommand {
    constructor(bot: Bot<BotContext>) {
        super(bot);
    }

    handle(): void {
        const actionName = MAIN_BUTTONS.get("account")?.name || "Личный кабинет";

        this.bot.hears(actionName, async ctx => {
            this.chatId = ctx.chatId;
            ctx.session.scene = "account";

            await ctx.reply("Этот раздел пока недоступен...");
        });
    }

}