import js from "@eslint/js";
import globals from "globals";
import {defineConfig} from "eslint/config";


export default defineConfig([
	{files: ["**/*.{js,mjs,cjs,ts}"], plugins: {js}, extends: ["js/recommended"]},
	{files: ["**/*.{js,mjs,cjs,ts}"], languageOptions: {globals: globals.browser}},
	{
		rules: {
			"indent": ["error", "tab"],
			"no-tabs": 0,
		}
	},
	tseslint.configs.recommended,
]);