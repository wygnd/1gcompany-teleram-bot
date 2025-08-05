import {CommandsFlavor} from "@grammyjs/commands";
import {Context, SessionFlavor} from "grammy";

export interface SessionData {
	user: UserData;
	alreadyRegistered: boolean;
	scene: ScenesType
	orders: Order[]
}

export type BotContext = Context & SessionFlavor<SessionData> & CommandsFlavor;

export interface UserData {
	name: string | null;
	phone: string | null;
	organization: string | null;
}

export type ScenesType = "registration" | "help" | "order" | "lobby" | "account" | "orders-list";

type TOrganizations = `${EOrganizations}`;

const enum EOrganizations {
	INDIVIDUAL = "ИП",
	COMPANY = "ООО",
	SELF_EMPLOYED = "СЗ",
	PHYSICAL = "ФЛ",
	NONE = ""
}

const enum EUserTypes {
	UNREGISTER = "unregister",
	PROCESS = "process",
	REGISTER = "register",
}

export interface IOrderEntity {
	pick_date: string;
	pick_type: string;
	pick_address: string;
	provider: string;
	product: string;
	attachment: string
	for: string;
}

export interface Order extends IOrderEntity {
	ID: string;
	createAt: number;
}
