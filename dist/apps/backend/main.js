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
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 4 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const app_controller_1 = __webpack_require__(6);
const app_service_1 = __webpack_require__(7);
const auth_controller_1 = __webpack_require__(26);
const backend_1 = __webpack_require__(9);
const feature_1 = __webpack_require__(29);
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(feature_1.AuthMiddleware)
            .exclude({ path: 'auth/login', method: common_1.RequestMethod.POST }, { path: 'auth/refresh', method: common_1.RequestMethod.POST })
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [
            backend_1.AppConfigModule,
            backend_1.PrismaModule,
            feature_1.AuthModule,
        ],
        controllers: [app_controller_1.AppController, auth_controller_1.AuthController],
        providers: [app_service_1.AppService],
    })
], AppModule);


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("tslib");

/***/ }),
/* 6 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppController = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const app_service_1 = __webpack_require__(7);
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
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const config_1 = __webpack_require__(8);
const backend_1 = __webpack_require__(9);
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
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(10), exports);
tslib_1.__exportStar(__webpack_require__(12), exports);


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(11), exports);


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AppConfigModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const config_1 = __webpack_require__(8);
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
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(13), exports);
tslib_1.__exportStar(__webpack_require__(14), exports);


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const prisma_service_1 = __webpack_require__(14);
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
/* 14 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var PrismaService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PrismaService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const client_1 = __webpack_require__(15);
const adapter_mariadb_1 = __webpack_require__(25);
const config_1 = __webpack_require__(8);
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
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
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        const maxRetries = 10;
        const delayMs = 3000;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.$connect();
                return;
            }
            catch (err) {
                if (attempt === maxRetries)
                    throw err;
                this.logger.warn(`Database not ready, retrying in ${delayMs / 1000}s... (${attempt}/${maxRetries})`);
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], PrismaService);


/***/ }),
/* 15 */
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
const tslib_1 = __webpack_require__(5);
const path = tslib_1.__importStar(__webpack_require__(16));
const node_url_1 = __webpack_require__(17);
globalThis['__dirname'] = path.dirname((0, node_url_1.fileURLToPath)("file:///home/app/ube-hr/generated/prisma/client.ts"));
const $Class = tslib_1.__importStar(__webpack_require__(18));
const Prisma = tslib_1.__importStar(__webpack_require__(23));
exports.Prisma = Prisma;
exports.$Enums = tslib_1.__importStar(__webpack_require__(24));
tslib_1.__exportStar(__webpack_require__(24), exports);
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
/* 16 */
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("node:url");

/***/ }),
/* 18 */
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
const tslib_1 = __webpack_require__(5);
const runtime = tslib_1.__importStar(__webpack_require__(19));
const config = {
    "previewFeatures": [],
    "clientVersion": "7.6.0",
    "engineVersion": "75cbdc1eb7150937890ad5465d861175c6624711",
    "activeProvider": "mysql",
    "inlineSchema": "generator client {\n  provider = \"prisma-client\"\n  output   = \"../generated/prisma\"\n}\n\ndatasource db {\n  provider = \"mysql\"\n}\n\nmodel User {\n  id                  Int      @id @default(autoincrement())\n  email               String   @unique\n  password            String\n  name                String?\n  refreshTokenVersion Int      @default(0)\n  createdAt           DateTime @default(now())\n  updatedAt           DateTime @updatedAt\n}\n",
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
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"password\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"refreshTokenVersion\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.updateOne\",\"User.updateMany\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"email\",\"password\",\"name\",\"refreshTokenVersion\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"search\",\"_relevance\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "NgkOChoAACcAMBsAAAQAEBwAACcAMB0CAAAAAR4BAAAAAR8BACkAISABACoAISECACgAISJAACsAISNAACsAIQEAAAABACABAAAAAQAgChoAACcAMBsAAAQAEBwAACcAMB0CACgAIR4BACkAIR8BACkAISABACoAISECACgAISJAACsAISNAACsAIQIgAAAsACAwAAA2ACADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAHHQIAAAABHgEAAAABHwEAAAABIAEAAAABIQIAAAABIkAAAAABI0AAAAABAQgAAAkAIAcdAgAAAAEeAQAAAAEfAQAAAAEgAQAAAAEhAgAAAAEiQAAAAAEjQAAAAAEBCAAACwAwBx0CADQAIR4BADIAIR8BADIAISABADMAISECADQAISJAADUAISNAADUAIQIAAAABACAIAAANACAHHQIANAAhHgEAMgAhHwEAMgAhIAEAMwAhIQIANAAhIkAANQAhI0AANQAhAgAAAAQAIAgAAA8AIAMAAAABACANAAAJACAOAAANACABAAAAAQAgAQAAAAQAIAYTAAAtACAUAAAuACAVAAAxACAWAAAwACAXAAAvACAgAAAsACAKGgAAGAAwGwAAFQAQHAAAGAAwHQIAGQAhHgEAGgAhHwEAGgAhIAEAGwAhIQIAGQAhIkAAHAAhI0AAHAAhAwAAAAQAIAMAABQAMBIAABUAIAMAAAAEACADAAAFADAEAAABACAKGgAAGAAwGwAAFQAQHAAAGAAwHQIAGQAhHgEAGgAhHwEAGgAhIAEAGwAhIQIAGQAhIkAAHAAhI0AAHAAhDRMAAB4AIBQAACYAIBUAAB4AIBYAAB4AIBcAAB4AICQCAAAAASUCAAAABCYCAAAABCcCAAAAASgCAAAAASkCAAAAASoCAAAAASsCACUAIQ8TAAAeACAWAAAkACAXAAAkACAkAQAAAAElAQAAAAQmAQAAAAQnAQAAAAEoAQAAAAEpAQAAAAEqAQAAAAErAQAjACEsAQAAAAEtAQAAAAEuAQAAAAEvAQAAAAEPEwAAIQAgFgAAIgAgFwAAIgAgJAEAAAABJQEAAAAFJgEAAAAFJwEAAAABKAEAAAABKQEAAAABKgEAAAABKwEAIAAhLAEAAAABLQEAAAABLgEAAAABLwEAAAABCxMAAB4AIBYAAB8AIBcAAB8AICRAAAAAASVAAAAABCZAAAAABCdAAAAAAShAAAAAASlAAAAAASpAAAAAAStAAB0AIQsTAAAeACAWAAAfACAXAAAfACAkQAAAAAElQAAAAAQmQAAAAAQnQAAAAAEoQAAAAAEpQAAAAAEqQAAAAAErQAAdACEIJAIAAAABJQIAAAAEJgIAAAAEJwIAAAABKAIAAAABKQIAAAABKgIAAAABKwIAHgAhCCRAAAAAASVAAAAABCZAAAAABCdAAAAAAShAAAAAASlAAAAAASpAAAAAAStAAB8AIQ8TAAAhACAWAAAiACAXAAAiACAkAQAAAAElAQAAAAUmAQAAAAUnAQAAAAEoAQAAAAEpAQAAAAEqAQAAAAErAQAgACEsAQAAAAEtAQAAAAEuAQAAAAEvAQAAAAEIJAIAAAABJQIAAAAFJgIAAAAFJwIAAAABKAIAAAABKQIAAAABKgIAAAABKwIAIQAhDCQBAAAAASUBAAAABSYBAAAABScBAAAAASgBAAAAASkBAAAAASoBAAAAASsBACIAISwBAAAAAS0BAAAAAS4BAAAAAS8BAAAAAQ8TAAAeACAWAAAkACAXAAAkACAkAQAAAAElAQAAAAQmAQAAAAQnAQAAAAEoAQAAAAEpAQAAAAEqAQAAAAErAQAjACEsAQAAAAEtAQAAAAEuAQAAAAEvAQAAAAEMJAEAAAABJQEAAAAEJgEAAAAEJwEAAAABKAEAAAABKQEAAAABKgEAAAABKwEAJAAhLAEAAAABLQEAAAABLgEAAAABLwEAAAABDRMAAB4AIBQAACYAIBUAAB4AIBYAAB4AIBcAAB4AICQCAAAAASUCAAAABCYCAAAABCcCAAAAASgCAAAAASkCAAAAASoCAAAAASsCACUAIQgkCAAAAAElCAAAAAQmCAAAAAQnCAAAAAEoCAAAAAEpCAAAAAEqCAAAAAErCAAmACEKGgAAJwAwGwAABAAQHAAAJwAwHQIAKAAhHgEAKQAhHwEAKQAhIAEAKgAhIQIAKAAhIkAAKwAhI0AAKwAhCCQCAAAAASUCAAAABCYCAAAABCcCAAAAASgCAAAAASkCAAAAASoCAAAAASsCAB4AIQwkAQAAAAElAQAAAAQmAQAAAAQnAQAAAAEoAQAAAAEpAQAAAAEqAQAAAAErAQAkACEsAQAAAAEtAQAAAAEuAQAAAAEvAQAAAAEMJAEAAAABJQEAAAAFJgEAAAAFJwEAAAABKAEAAAABKQEAAAABKgEAAAABKwEAIgAhLAEAAAABLQEAAAABLgEAAAABLwEAAAABCCRAAAAAASVAAAAABCZAAAAABCdAAAAAAShAAAAAASlAAAAAASpAAAAAAStAAB8AIQAAAAAAAAExAQAAAAEBMQEAAAABBTECAAAAATICAAAAATMCAAAAATQCAAAAATUCAAAAAQExQAAAAAEBLwEAAAABAAAFEwAEFAAFFQAGFgAHFwAIAAAAAAAFEwAEFAAFFQAGFgAHFwAIAQIBAgMBBQYBBgcBBwgBCQoBCgwCCw4BDBACDxEBEBIBERMCGBYDGRcJ"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await Promise.resolve().then(() => tslib_1.__importStar(__webpack_require__(20)));
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await Promise.resolve().then(() => tslib_1.__importStar(__webpack_require__(21))),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await Promise.resolve().then(() => tslib_1.__importStar(__webpack_require__(22)));
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/client");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("node:buffer");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/query_compiler_fast_bg.mysql.mjs");

/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("@prisma/client/runtime/query_compiler_fast_bg.mysql.wasm-base64.mjs");

/***/ }),
/* 23 */
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
const tslib_1 = __webpack_require__(5);
const runtime = tslib_1.__importStar(__webpack_require__(19));
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
    refreshTokenVersion: 'refreshTokenVersion',
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
/* 24 */
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
/* 25 */
/***/ ((module) => {

module.exports = require("@prisma/adapter-mariadb");

/***/ }),
/* 26 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthController = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const express_1 = __webpack_require__(27);
const swagger_1 = __webpack_require__(28);
const feature_1 = __webpack_require__(29);
const REFRESH_COOKIE = 'refresh_token';
const cookieOptions = {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(req, _body, res) {
        const { access_token, refresh_token } = await this.authService.login(req.user);
        res.cookie(REFRESH_COOKIE, refresh_token, cookieOptions);
        return { access_token };
    }
    async refresh(req, res) {
        const token = req.cookies?.[REFRESH_COOKIE];
        if (!token)
            throw new common_1.UnauthorizedException('Missing refresh token');
        const { access_token, refresh_token } = await this.authService.refresh(token);
        res.cookie(REFRESH_COOKIE, refresh_token, cookieOptions);
        return { access_token };
    }
    async logout(req, res) {
        await this.authService.logout(req.user.id);
        res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
        return { message: 'Logged out successfully' };
    }
    me(req) {
        return req.user;
    }
};
exports.AuthController = AuthController;
tslib_1.__decorate([
    (0, common_1.UseGuards)(feature_1.LocalAuthGuard),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiBody)({ type: feature_1.LoginDto }),
    (0, swagger_1.ApiOkResponse)({ type: feature_1.TokenResponseDto }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Body)()),
    tslib_1.__param(2, (0, common_1.Res)({ passthrough: true })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_b = typeof feature_1.AuthenticatedRequest !== "undefined" && feature_1.AuthenticatedRequest) === "function" ? _b : Object, typeof (_c = typeof feature_1.LoginDto !== "undefined" && feature_1.LoginDto) === "function" ? _c : Object, typeof (_d = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _d : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
tslib_1.__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Exchange refresh token cookie for a new token pair' }),
    (0, swagger_1.ApiOkResponse)({ type: feature_1.TokenResponseDto }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Res)({ passthrough: true })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_e = typeof feature_1.AuthenticatedRequest !== "undefined" && feature_1.AuthenticatedRequest) === "function" ? _e : Object, typeof (_f = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _f : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
tslib_1.__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout and invalidate refresh token' }),
    (0, swagger_1.ApiOkResponse)({ schema: { properties: { message: { type: 'string', example: 'Logged out successfully' } } } }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__param(1, (0, common_1.Res)({ passthrough: true })),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_g = typeof feature_1.AuthenticatedRequest !== "undefined" && feature_1.AuthenticatedRequest) === "function" ? _g : Object, typeof (_h = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _h : Object]),
    tslib_1.__metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
tslib_1.__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current authenticated user' }),
    (0, swagger_1.ApiOkResponse)({ type: feature_1.UserResponseDto }),
    tslib_1.__param(0, (0, common_1.Req)()),
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [typeof (_j = typeof feature_1.AuthenticatedRequest !== "undefined" && feature_1.AuthenticatedRequest) === "function" ? _j : Object]),
    tslib_1.__metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = tslib_1.__decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof feature_1.AuthService !== "undefined" && feature_1.AuthService) === "function" ? _a : Object])
], AuthController);


/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 29 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(30), exports);
tslib_1.__exportStar(__webpack_require__(37), exports);


/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(31), exports);
tslib_1.__exportStar(__webpack_require__(32), exports);
tslib_1.__exportStar(__webpack_require__(36), exports);


/***/ }),
/* 31 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const users_service_1 = __webpack_require__(32);
let UsersModule = class UsersModule {
};
exports.UsersModule = UsersModule;
exports.UsersModule = UsersModule = tslib_1.__decorate([
    (0, common_1.Module)({
        providers: [users_service_1.UsersService],
        exports: [users_service_1.UsersService],
    })
], UsersModule);


/***/ }),
/* 32 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const shared_1 = __webpack_require__(33);
const backend_1 = __webpack_require__(9);
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByEmailAndPassword(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return null;
        const valid = await shared_1.secrets.verify(user.password, password);
        if (!valid)
            return null;
        return user;
    }
    async findById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async incrementTokenVersion(id) {
        const user = await this.prisma.user.update({
            where: { id },
            data: { refreshTokenVersion: { increment: 1 } },
        });
        return user.refreshTokenVersion;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof backend_1.PrismaService !== "undefined" && backend_1.PrismaService) === "function" ? _a : Object])
], UsersService);


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.secrets = void 0;
const tslib_1 = __webpack_require__(5);
exports.secrets = tslib_1.__importStar(__webpack_require__(34));


/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.hash = hash;
exports.verify = verify;
const tslib_1 = __webpack_require__(5);
const argon2 = tslib_1.__importStar(__webpack_require__(35));
async function hash(password) {
    return argon2.hash(password);
}
async function verify(hash, password) {
    return argon2.verify(hash, password);
}


/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("argon2");

/***/ }),
/* 36 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserResponseDto = void 0;
const tslib_1 = __webpack_require__(5);
const swagger_1 = __webpack_require__(28);
class UserResponseDto {
}
exports.UserResponseDto = UserResponseDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    tslib_1.__metadata("design:type", Number)
], UserResponseDto.prototype, "id", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    tslib_1.__metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(5);
tslib_1.__exportStar(__webpack_require__(38), exports);
tslib_1.__exportStar(__webpack_require__(41), exports);
tslib_1.__exportStar(__webpack_require__(47), exports);
tslib_1.__exportStar(__webpack_require__(46), exports);
tslib_1.__exportStar(__webpack_require__(48), exports);
tslib_1.__exportStar(__webpack_require__(44), exports);
tslib_1.__exportStar(__webpack_require__(49), exports);
tslib_1.__exportStar(__webpack_require__(50), exports);


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthModule = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const jwt_1 = __webpack_require__(39);
const passport_1 = __webpack_require__(40);
const config_1 = __webpack_require__(8);
const auth_service_1 = __webpack_require__(41);
const local_strategy_1 = __webpack_require__(42);
const jwt_strategy_1 = __webpack_require__(44);
const local_auth_guard_1 = __webpack_require__(46);
const jwt_auth_guard_1 = __webpack_require__(47);
const auth_middleware_1 = __webpack_require__(48);
const users_module_1 = __webpack_require__(31);
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = tslib_1.__decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.getOrThrow('JWT_SECRET'),
                    signOptions: { expiresIn: '1d' },
                }),
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            local_strategy_1.LocalStrategy,
            jwt_strategy_1.JwtStrategy,
            local_auth_guard_1.LocalAuthGuard,
            jwt_auth_guard_1.JwtAuthGuard,
            auth_middleware_1.AuthMiddleware,
        ],
        exports: [auth_service_1.AuthService, jwt_1.JwtModule, local_auth_guard_1.LocalAuthGuard, jwt_auth_guard_1.JwtAuthGuard, auth_middleware_1.AuthMiddleware],
    })
], AuthModule);


/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("@nestjs/passport");

/***/ }),
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const jwt_1 = __webpack_require__(39);
const config_1 = __webpack_require__(8);
const users_service_1 = __webpack_require__(32);
let AuthService = class AuthService {
    constructor(usersService, jwtService, config) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
    }
    async validateUser(email, password) {
        return this.usersService.findByEmailAndPassword(email, password);
    }
    async login(user) {
        const newVersion = await this.usersService.incrementTokenVersion(user.id);
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user),
            this.signRefreshToken(user.id, newVersion),
        ]);
        return { access_token: accessToken, refresh_token: refreshToken };
    }
    async refresh(rawToken) {
        let payload;
        try {
            payload = this.jwtService.verify(rawToken, {
                secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const user = await this.usersService.findById(payload.sub);
        if (!user)
            throw new common_1.UnauthorizedException();
        if (payload.ver !== user.refreshTokenVersion) {
            // Reuse detected — invalidate all sessions for this user
            await this.usersService.incrementTokenVersion(user.id);
            throw new common_1.UnauthorizedException('Token reuse detected');
        }
        const newVersion = await this.usersService.incrementTokenVersion(user.id);
        const [accessToken, refreshToken] = await Promise.all([
            this.signAccessToken(user),
            this.signRefreshToken(user.id, newVersion),
        ]);
        return { access_token: accessToken, refresh_token: refreshToken };
    }
    async logout(userId) {
        await this.usersService.incrementTokenVersion(userId);
    }
    signAccessToken(user) {
        return this.jwtService.signAsync({ sub: user.id, email: user.email }, {
            secret: this.config.getOrThrow('JWT_SECRET'),
            expiresIn: '15m',
        });
    }
    signRefreshToken(userId, version) {
        return this.jwtService.signAsync({ sub: userId, ver: version }, {
            secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object, typeof (_b = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], AuthService);


/***/ }),
/* 42 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalStrategy = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const passport_1 = __webpack_require__(40);
const passport_local_1 = __webpack_require__(43);
const auth_service_1 = __webpack_require__(41);
let LocalStrategy = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy) {
    constructor(authService) {
        super({ usernameField: 'email' });
        this.authService = authService;
    }
    async validate(email, password) {
        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return user;
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], LocalStrategy);


/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("passport-local");

/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtStrategy = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const config_1 = __webpack_require__(8);
const passport_1 = __webpack_require__(40);
const passport_jwt_1 = __webpack_require__(45);
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(config) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow('JWT_SECRET'),
        });
    }
    async validate(payload) {
        return { id: payload.sub, email: payload.email };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], JwtStrategy);


/***/ }),
/* 45 */
/***/ ((module) => {

module.exports = require("passport-jwt");

/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LocalAuthGuard = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const passport_1 = __webpack_require__(40);
let LocalAuthGuard = class LocalAuthGuard extends (0, passport_1.AuthGuard)('local') {
};
exports.LocalAuthGuard = LocalAuthGuard;
exports.LocalAuthGuard = LocalAuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)()
], LocalAuthGuard);


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtAuthGuard = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const passport_1 = __webpack_require__(40);
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = tslib_1.__decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);


/***/ }),
/* 48 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthMiddleware = void 0;
const tslib_1 = __webpack_require__(5);
const common_1 = __webpack_require__(1);
const jwt_1 = __webpack_require__(39);
const config_1 = __webpack_require__(8);
let AuthMiddleware = class AuthMiddleware {
    constructor(jwtService, config) {
        this.jwtService = jwtService;
        this.config = config;
    }
    use(req, _res, next) {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing or malformed token');
        }
        const token = authHeader.slice(7);
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.config.getOrThrow('JWT_SECRET'),
            });
            req.user = { id: payload.sub, email: payload.email };
            next();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.AuthMiddleware = AuthMiddleware;
exports.AuthMiddleware = AuthMiddleware = tslib_1.__decorate([
    (0, common_1.Injectable)(),
    tslib_1.__metadata("design:paramtypes", [typeof (_a = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], AuthMiddleware);


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LoginDto = void 0;
const tslib_1 = __webpack_require__(5);
const swagger_1 = __webpack_require__(28);
class LoginDto {
}
exports.LoginDto = LoginDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123' }),
    tslib_1.__metadata("design:type", String)
], LoginDto.prototype, "password", void 0);


/***/ }),
/* 50 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenResponseDto = void 0;
const tslib_1 = __webpack_require__(5);
const swagger_1 = __webpack_require__(28);
class TokenResponseDto {
}
exports.TokenResponseDto = TokenResponseDto;
tslib_1.__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
    tslib_1.__metadata("design:type", String)
], TokenResponseDto.prototype, "access_token", void 0);


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
const cookieParser = __webpack_require__(3);
const app_module_1 = __webpack_require__(4);
const swagger_1 = __webpack_require__(28);
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.enableCors({ origin: true, credentials: true });
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.PORT || 3000;
    const config = new swagger_1.DocumentBuilder()
        .setTitle('UBE HR API')
        .setDescription('The UBE HR API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, documentFactory, {
        swaggerOptions: {
            persistAuthorization: true,
        },
        customJsStr: `
      window.addEventListener('load', function () {
        const _fetch = window.fetch;
        window.fetch = async function (...args) {
          const response = await _fetch(...args);
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
          if (url && url.includes('/auth/login') && response.ok) {
            response.clone().json().then(function (data) {
              if (data && data.access_token && window.ui) {
                window.ui.preauthorizeApiKey('bearer', data.access_token);
              }
            }).catch(function () {});
          }
          return response;
        };
      });
    `,
    });
    await app.listen(port);
    common_1.Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}
bootstrap();

})();

/******/ })()
;
//# sourceMappingURL=main.js.map