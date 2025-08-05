import {BaseCommand, IBaseCommandFields} from "../command.abstract";
import {BotContext, UserData} from "../../context/context.interface";
import {Bot} from "grammy";
import {EMOJIS, MAIN_BUTTONS, MANAGER_TELEGRAM} from "../../constants";
import {generateActionKeyboardButtons} from "../../utils";

const fieldsClass = new Map<keyof UserData, IBaseCommandFields>([
	["name", {
		name: "Имя",
		slug: "name",
		index: 0,
		value: "",
		required: true
	}],
	["phone", {
		name: "Телефон",
		slug: "phone",
		index: 0,
		value: "",
		required: true
	}],
	["organization", {
		name: "Организация",
		slug: "organization",
		index: 0,
		value: "",
		required: true
	}]
]);

export class RegistrationCommand extends BaseCommand {
	private readonly TemplateHelpText = `Остались вопросы? ` +
		`Просто [напишите нам](t.me/${MANAGER_TELEGRAM}) - мы всегда готовы помочь!`;
	private handleField: keyof UserData | null;

	constructor(bot: Bot<BotContext>) {
		super(bot, fieldsClass);
		this.handleField = null;
	}

	handle(): void {
		const actionName = MAIN_BUTTONS.get("registration")?.name || "Регистрация";

		this.bot.hears(actionName, async ctx => {
			this.chatId = ctx.chatId;
			ctx.session.scene = "registration";
			// await this.registrationMenuMiddleware.replyToContext(ctx);
			await ctx.reply(`Для  начала, пожалуйста, укажите ваш номер телефона, ` +
				`чтобы мы могли зарегистрировать Вас и связаться при необходимости:\n` +
				`${EMOJIS.PHONE} Отправьте свой номер телефона через кнопку ниже\n` +
				`Далее напишите наименование вашей организации:\nПримеры заполнения:\n` +
				`${EMOJIS.INDIVIDUAL} ИП - ИП Васильев Андрей Павлович\n` +
				`${EMOJIS.COMPANY} ООО – ООО «Фулфилмент и точка»\n` +
				`${EMOJIS.SELF_EMPLOYED} СЗ – Самозанятый Петров Евгений Викторович\n` +
				`${EMOJIS.PHYSICAL} ФЛ – Иванов Аркадий Андреевич\n\n` +
				`Также укажите имя контактного лица и телефон для связи\n` +
				`Это поможет нам подготовить необходимые документы и предложить ` +
				`оптимальные условия.\n` + this.TemplateHelpText, {
				reply_markup: this.generateInlineKeyboardButtons(),
				parse_mode: "Markdown"
			});
		});

		this.fields.forEach(field => {
			const {name, slug} = field;

			if (!name || !slug) return;

			this.bot.callbackQuery(slug, async ctx => {
				const {msgId} = ctx;

				if (msgId) this.messageId = msgId;
				this.handleField = slug as keyof UserData;
				ctx.reply(`Введите ${name.toLowerCase()}:`)
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id))

				await ctx.answerCallbackQuery();
			});
		})

		this.bot.on("message:text", async (ctx, next) => {
			if (ctx.session.scene !== "registration") {
				await next();
				return;
			}

			if (!this.handleField) {
				ctx.reply("Выберите поле для ввода...")
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));
				return;
			}

			const {text} = ctx.message;
			const field = this.fields.get(this.handleField);

			if (!field) {
				ctx.reply("Произошла ошибка, попробуйте еще раз")
					.then(callbackCtx => this.addHistoryMessageId(callbackCtx.message_id));
				return;
			}

			field.value = text;

			this.fields.set(this.handleField, field);

			this.handleField = null;
			await ctx.deleteMessages(this.messageIdsHistory);
			this.messageIdsHistory = [];

			await this.nextStep(ctx);
		});
	}

	private async nextStep(context: BotContext) {
		await this.bot.api.editMessageReplyMarkup(this.chatId, this.messageId, {
			reply_markup: this.generateInlineKeyboardButtons()
		})

		/* ==== Check if user has empty fields ==== */
		if (!this.checkFields()) {
			context.session.alreadyRegistered = true;
			context.session.user = {
				name: this.fields.get("name")?.value || "",
				phone: this.fields.get("phone")?.value || "",
				organization: this.fields.get("organization")?.value || ""
			}
			context.session.scene = "lobby";
			this.clearFields();
			await context.reply("Регистрация пройдена.", {
				reply_markup: generateActionKeyboardButtons(context)
			});
		}
	}
}