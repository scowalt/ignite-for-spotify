module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"node": true
	},
	"settings": {
		"react": {
			"version": "detect" // Avoid warning about react version during linting
		}
	},
	"extends": [
		'eslint:recommended',
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:react/recommended",
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"project": "tsconfig.json",
		"sourceType": "module"
	},
	"plugins": [
		"@typescript-eslint",
		"html" // required for .html files to work
	],
	"rules": {
		"@typescript-eslint/typedef": [
			"error",
			{
				"arrowParameter": false, // Zod makes variable declarations a bit too verbose
				"variableDeclaration": false, // Zod makes variable declarations a bit too verbose
			}
		],
		"@typescript-eslint/array-type": [
			"error",
			{
				"default": "array"
			}
		],
		"@typescript-eslint/ban-types": [
			"error",
			{
				"types": {
					"Object": {
						"message": "Avoid using the `Object` type. Did you mean `object`?"
					},
					"Function": {
						"message": "Avoid using the `Function` type. Prefer a specific function type, like `() => void`."
					},
					"Boolean": {
						"message": "Avoid using the `Boolean` type. Did you mean `boolean`?"
					},
					"Number": {
						"message": "Avoid using the `Number` type. Did you mean `number`?"
					},
					"String": {
						"message": "Avoid using the `String` type. Did you mean `string`?"
					},
					"Symbol": {
						"message": "Avoid using the `Symbol` type. Did you mean `symbol`?"
					}
				}
			}
		],
		"@typescript-eslint/indent": [
			"error",
			"tab"
		],
		"@typescript-eslint/member-delimiter-style": [
			"error",
			{
				"multiline": {
					"delimiter": "semi",
					"requireLast": true
				},
				"singleline": {
					"delimiter": "semi",
					"requireLast": false
				}
			}
		],
		"no-empty-function": "off", // Leave off, as it conflicts with TypeScript's "@typescript-eslint/no-empty-function"
		"@typescript-eslint/no-empty-function": ["error", {
			"allow": [
				"constructors", // needed to make default constructors private for singleton classes
			]
		}],
		"@typescript-eslint/no-misused-promises": [
			"error",
			{
				"checksVoidReturn": false
			}
		],
		"@typescript-eslint/no-inferrable-types": "off", // This rule clashes for "typdef" rule(s), see https://github.com/typescript-eslint/typescript-eslint/issues/902
		"@typescript-eslint/explicit-function-return-type": "error",
		"@typescript-eslint/no-non-null-assertion": "off", // Leaving this off makes integrating environment variables more simple
		"@typescript-eslint/no-empty-interface": "off", // Empty interfaces are good placeholders in case the interface needs expansion later
		"@typescript-eslint/no-explicit-any": "off", // This will make it less messy to type functions that return Promises whose output isn't needed
		"no-param-reassign": "error",
		"@typescript-eslint/no-parameter-properties": "error",
		"@typescript-eslint/no-require-imports": "error",
		"@typescript-eslint/no-use-before-define": "error",
		"@typescript-eslint/no-unsafe-member-access": "off", // Probably want to turn this on eventually, but my code is too much of a mess
		"@typescript-eslint/no-unsafe-assignment": "off", // Probably want to turn this on eventually, but my code is too much of a mess
		"@typescript-eslint/ban-types": "off", // Probably want to turn this on eventually, but right now I use {} a lot
		"@typescript-eslint/prefer-for-of": "error",
		"@typescript-eslint/prefer-function-type": "error",
		"@typescript-eslint/prefer-readonly": "error",
		"@typescript-eslint/semi": [
			"error",
			"always"
		],
		"@typescript-eslint/unified-signatures": "error",
		"camelcase": "error",
		"complexity": "error",
		"constructor-super": "error",
		"object-curly-spacing": ["warn", "always"],
		"curly": "error",
		"dot-notation": "error",
		"eqeqeq": [
			"error",
			"always"
		],
		"prefer-arrow-callback": "error",
		"guard-for-in": "error",
		"id-blacklist": [
			"error",
			"any",
			"Number",
			"number",
			"String",
			"string",
			"Boolean",
			"boolean",
			"Undefined"
		],
		"id-match": "error",
		"max-classes-per-file": [
			"error",
			1
		],
		"new-parens": "error",
		"no-bitwise": "error",
		"no-caller": "error",
		"no-cond-assign": "error",
		"no-console": "error",
		"no-debugger": "error",
		"no-empty": "error",
		"no-eval": "error",
		"no-fallthrough": "error",
		"no-invalid-this": "error",
		"no-new-wrappers": "error",
		"no-shadow": [
			"error",
			{
				"hoist": "all"
			}
		],
		"no-throw-literal": "error",
		"no-trailing-spaces": "error",
		"no-undef-init": "error",
		"no-underscore-dangle": "error",
		"no-unsafe-finally": "error",
		"no-unused-expressions": "error",
		"no-unused-labels": "error",
		"object-shorthand": "error",
		"@typescript-eslint/no-unused-vars": "off", // This is bugged when the variable is used for a type
		"one-var": [ "error", "never" ],
		"radix": "error",
		"spaced-comment": "error",
		"use-isnan": "error",
		"valid-typeof": "error",
		"keyword-spacing": "warn",
		"eol-last": ["warn", "always"],
		"space-infix-ops": "warn",
		"no-shadow": "off"
	}
};
