import {Bot, InlineKeyboard} from "grammy";
import {BotContext} from "../context/context.interface";
import {hasNullableFields} from "../utils";
import {EMOJIS} from "../constants";

export interface IBaseCommandFields {
	name: string;
	slug: string;
	value: string;
	index: number;
	textForInput?: string;
	required?: boolean;
}

export abstract class BaseCommand {
	protected $messageId: number | null;
	protected $chatId: number | null;
	protected $fields: Map<string, IBaseCommandFields>;
	protected $messageIdsHistory: number[];
	protected $bot: Bot<BotContext>;

	protected constructor(bot: Bot<BotContext>, fields: Map<string, IBaseCommandFields> = new Map()) {
		this.$messageId = null;
		this.$chatId = null;
		this.$fields = fields;
		this.$messageIdsHistory = [];
		this.$bot = bot;
	}

	abstract handle(): void

	protected generateInlineKeyboardButtons(moreButtons: string[] = []): InlineKeyboard {
		const inlineKeyboard = new InlineKeyboard();
		let targetIndex = 0;
		let keyboardButtonText = "";

		this.$fields.forEach(field => {
			const {name, slug, value, index} = field;
			keyboardButtonText = name;

			if (targetIndex < index) {
				targetIndex = index;
				inlineKeyboard.row();
			}

			if (value) keyboardButtonText = EMOJIS.CHECK_MARK + "" + name;
			// if (value) return;

			inlineKeyboard.text(keyboardButtonText, slug);
		})


		if (moreButtons.length > 0) {
			targetIndex = 0;
			moreButtons.map(mBtn => {
				const [name, slug, index] = mBtn.split("|")
				const indexInt = parseInt(index);

				if (targetIndex < indexInt) {
					targetIndex = indexInt;
					inlineKeyboard.row();
				}

				inlineKeyboard.text(name, slug);
			})
		}

		return inlineKeyboard;
	};

	protected checkFields(): boolean {
		/* Return false if it hasn't empty fields */
		let hasEmptyFields = false;

		this.$fields.forEach(field => {
			const {value} = field;

			if (value !== null && typeof value === "object") {
				hasEmptyFields = hasNullableFields(value);
				return;
			}

			if (value) return;

			hasEmptyFields = true;
		})

		return hasEmptyFields;
	}

	protected set messageId(msgId: number) {
		if (this.$messageId) return;

		this.$messageId = msgId;
	}

	protected get messageId(): number {
		return this.$messageId || -1;
	}

	protected set chatId(chatId: number) {
		this.$chatId = chatId;
	}

	protected get chatId(): number {
		return this.$chatId || -1;
	}

	protected get fields(): Map<string, IBaseCommandFields> {
		return this.$fields;
	}

	protected clearFields(): void {
		this.$fields.forEach(field => {
			field.value = "";
		})
	}

	protected addHistoryMessageId(msgId: number): void {
		this.$messageIdsHistory.push(msgId);
	}

	protected set messageIdsHistory(msgIds: number[]) {
		this.$messageIdsHistory = msgIds;
	}

	protected get messageIdsHistory(): number[] {
		return this.$messageIdsHistory;
	}

	public get bot(): Bot<BotContext> {
		return this.$bot;
	}

	protected async clearInlineKeyboardButtons(message_id: number) {
		if (!this.$chatId) return;

		await this.$bot.api.editMessageReplyMarkup(this.$chatId, message_id, {
			reply_markup: new InlineKeyboard()
		});
	}

	protected prepareTextForMarkdownV2(text: string): string {
		return text.replace(/\_/g, '\\_')
			.replace(/\*/g, '\\*')
			.replace(/\[/g, '\\[')
			.replace(/\]/g, '\\]')
			.replace(/\(/g, '\\(')
			.replace(/\)/g, '\\)')
			.replace(/\~/g, '\\~')
			.replace(/\`/g, '\\`')
			.replace(/\>/g, '\\>')
			.replace(/\#/g, '\\#')
			.replace(/\+/g, '\\+')
			.replace(/\-/g, '\\-')
			.replace(/\=/g, '\\=')
			.replace(/\|/g, '\\|')
			.replace(/\{/g, '\\{')
			.replace(/\}/g, '\\}')
			.replace(/\./g, '\\.')
			.replace(/\!/g, '\\!')
	}
}