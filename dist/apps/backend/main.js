/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const app_controller_1 = __webpack_require__(5);
const app_service_1 = __webpack_require__(6);
const backend_1 = __webpack_require__(8);
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            backend_1.AppConfigModule,
            backend_1.PrismaModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const app_service_1 = __webpack_require__(6);
let AppController = class AppController {
    constructor(appService) {
        this.appService = appService;
    }
    getData() {
        return this.appService.getData();
    }
};
exports.AppController = AppController;
tslib_1.__decorate([
    (0, common_1.Get)(),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], AppController.prototype, "getData", null);
exports.AppController = AppController = tslib_1.__decorate([
    (0, common_1.Controller)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof app_service_1.AppService !== "undefined" && app_service_1.AppService) === "function" ? _a : Object])
], AppController);


/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const config_1 = __webpack_require__(7);
const backend_1 = __webpack_require__(8);
let AppService = class AppService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    async getData() {
        const config = {
            host: this.config.getOrThrow('MYSQL_HOST'),
            port: this.config.getOrThrow('MYSQL_PORT'),
            user: this.config.getOrThrow('MYSQL_USER'),
            password: this.config.getOrThrow('MYSQL_PASSWORD'),
            database: this.config.getOrThrow('MYSQL_DATABASE'),
        };
        const users = await this.prisma.user.findMany();
        return { message: 'Hello API', users, config };
    }
};
exports.AppService = AppService;
exports.AppService = AppService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof backend_1.PrismaService !== "undefined" && backend_1.PrismaService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], AppService);


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(4);
tslib_1.__exportStar(__webpack_require__(9), exports);
tslib_1.__exportStar(__webpack_require__(11), exports);


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(4);
tslib_1.__exportStar(__webpack_require__(10), exports);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppConfigModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const config_1 = __webpack_require__(7);
let AppConfigModule = class AppConfigModule {
};
exports.AppConfigModule = AppConfigModule;
exports.AppConfigModule = AppConfigModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true
            }),
        ],
    })
], AppConfigModule);


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(4);
tslib_1.__exportStar(__webpack_require__(12), exports);
tslib_1.__exportStar(__webpack_require__(13), exports);


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaModule = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const prisma_service_1 = __webpack_require__(13);
let PrismaModule = class PrismaModule {
};
exports.PrismaModule = PrismaModule;
exports.PrismaModule = PrismaModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [prisma_service_1.PrismaService],
        exports: [prisma_service_1.PrismaService],
    })
], PrismaModule);


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(4);
const common_1 = __webpack_require__(1);
const client_1 = __webpack_require__(14);
const adapter_mariadb_1 = __webpack_require__(24);
const config_1 = __webpack_require__(7);
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor(config) {
        const adapter = new adapter_mariadb_1.PrismaMariaDb({
            host: config.getOrThrow('MYSQL_HOST'),
            port: config.getOrThrow('MYSQL_PORT'),
            user: config.getOrThrow('MYSQL_USER'),
            password: config.getOrThrow('MYSQL_PASSWORD'),
            database: config.getOrThrow('MYSQL_DATABASE'),
            connectionLimit: 5,
        });
        super({ adapter });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], PrismaService);


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * This file should be your main import to use Prisma. Through it you get access to all the models, enums, and input types.
 * If you're looking for something you can import in the client-side of your application, please refer to the `browser.ts` file instead.
 *
 * 🟢 You can import this file directly.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Prisma = exports.PrismaClient = exports.$Enums = void 0;
const tslib_1 = __webpack_require__(4);
const path = tslib_1.__importStar(__webpack_require__(15));
const node_url_1 = __webpack_require__(16);
globalThis['__dirname'] = path.dirname((0, node_url_1.fileURLToPath)("file:///home/app/ube-hr/generated/prisma/client.ts"));
const $Class = tslib_1.__importStar(__webpack_require__(17));
const Prisma = tslib_1.__importStar(__webpack_require__(22));
exports.Prisma = Prisma;
exports.$Enums = tslib_1.__importStar(__webpack_require__(23));
tslib_1.__exportStar(__webpack_require__(23), exports);
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
exports.PrismaClient = $Class.getPrismaClientClass();


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("node:url");

/***/ }),
/* 17 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * Please import the `PrismaClient` class from the `client.ts` file instead.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getPrismaClientClass = getPrismaClientClass;
const tslib_1 = __webpack_require__(4);
const runtime = tslib_1.__importStar(__webpack_require__(18));
const config = {
    "previewFeatures": [],
    "clientVersion": "7.6.0",
    "engineVersion": "75cbdc1eb7150937890ad5465d861175c6624711",
    "activeProvider": "mysql",
    "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../generated/prisma\"\n}\n\ndatasource db {\n  provider = \"mysql\"\n}\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  password  String\n  name      String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.updateOne\",\"User.updateMany\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"email\",\"password\",\"name\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"search\",\"_relevance\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "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"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await Promise.resolve().then(() => tslib_1.__importStar(__webpack_require__(19)));
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await Promise.resolve().then(() => tslib_1.__importStar(__webpack_require__(20))),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await Promise.resolve().then(() => tslib_1.__importStar(__webpack_require__(21)));
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}


/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/client");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/query_compiler_fast_bg.mysql.mjs");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/query_compiler_fast_bg.mysql.wasm-base64.mjs");

/***/ }),
/* 22 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// biome-ignore-all lint: generated file
// @ts-nocheck 
/*
 * WARNING: This is an internal file that is subject to change!
 *
 * 🛑 Under no circumstances should you import this file directly! 🛑
 *
 * All exports from this file are wrapped under a `Prisma` namespace object in the client.ts file.
 * While this enables partial backward compatibility, it is not part of the stable public API.
 *
 * If you are looking for your Models, Enums, and Input Types, please import them from the respective
 * model files in the `model` directory!
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.defineExtension = exports.UserOrderByRelevanceFieldEnum = exports.NullsOrder = exports.SortOrder = exports.UserScalarFieldEnum = exports.TransactionIsolationLevel = exports.ModelName = exports.AnyNull = exports.JsonNull = exports.DbNull = exports.NullTypes = exports.prismaVersion = exports.getExtensionContext = exports.Decimal = exports.Sql = exports.raw = exports.join = exports.empty = exports.sql = exports.PrismaClientValidationError = exports.PrismaClientInitializationError = exports.PrismaClientRustPanicError = exports.PrismaClientUnknownRequestError = exports.PrismaClientKnownRequestError = void 0;
const tslib_1 = __webpack_require__(4);
const runtime = tslib_1.__importStar(__webpack_require__(18));
/**
 * Prisma Errors
 */
exports.PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
exports.PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
exports.PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
exports.PrismaClientInitializationError = runtime.PrismaClientInitializationError;
exports.PrismaClientValidationError = runtime.PrismaClientValidationError;
/**
 * Re-export of sql-template-tag
 */
exports.sql = runtime.sqltag;
exports.empty = runtime.empty;
exports.join = runtime.join;
exports.raw = runtime.raw;
exports.Sql = runtime.Sql;
/**
 * Decimal.js
 */
exports.Decimal = runtime.Decimal;
exports.getExtensionContext = runtime.Extensions.getExtensionContext;
/**
 * Prisma Client JS version: 7.6.0
 * Query Engine version: 75cbdc1eb7150937890ad5465d861175c6624711
 */
exports.prismaVersion = {
    client: "7.6.0",
    engine: "75cbdc1eb7150937890ad5465d861175c6624711"
};
exports.NullTypes = {
    DbNull: runtime.NullTypes.DbNull,
    JsonNull: runtime.NullTypes.JsonNull,
    AnyNull: runtime.NullTypes.AnyNull,
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
exports.DbNull = runtime.DbNull;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
exports.JsonNull = runtime.JsonNull;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
exports.AnyNull = runtime.AnyNull;
exports.ModelName = {
    User: 'User'
};
/**
 * Enums
 */
exports.TransactionIsolationLevel = runtime.makeStrictEnum({
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
});
exports.UserScalarFieldEnum = {
    id: 'id',
    email: 'email',
    password: 'password',
    name: 'name',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
};
exports.SortOrder = {
    asc: 'asc',
    desc: 'desc'
};
exports.NullsOrder = {
    first: 'first',
    last: 'last'
};
exports.UserOrderByRelevanceFieldEnum = {
    email: 'email',
    password: 'password',
    name: 'name'
};
exports.defineExtension = runtime.Extensions.defineExtension;


/***/ }),
/* 23 */
/***/ ((__unused_webpack_module, exports) => {


/* !!! This is code generated by Prisma. Do not edit directly. !!! */
/* eslint-disable */
// biome-ignore-all lint: generated file
// @ts-nocheck 
/*
* This file exports all enum related types from the schema.
*
* 🟢 You can import this file directly.
*/
Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("@prisma/adapter-mariadb");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const common_1 = __webpack_require__(1);
const core_1 = __webpack_require__(2);
const app_module_1 = __webpack_require__(3);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.PORT || 3000;
    await app.listen(port);
    common_1.Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
bootstrap();

})();

/******/ })()
;
//# sourceMappingURL=main.js.map