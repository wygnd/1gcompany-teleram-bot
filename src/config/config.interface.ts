import {BotCommand} from "@grammyjs/types";

export interface IConfigService {
    get(key: string): string;
    getCommands(): MapIterator<BotCommand>
}