"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebHookAuthHttpClient = void 0;
const http_1 = require("http");
const https_1 = require("https");
const url_1 = require("url");
// eslint-disable-next-line import/no-unresolved
const parse_1 = require("jose/jwk/parse");
// eslint-disable-next-line import/no-unresolved
const sign_1 = require("jose/jwt/sign");
const InternalServerError_1 = require("../../../util/errors/InternalServerError");
const PathUtil_1 = require("../../../util/PathUtil");
const PodJwksHttpHandler_1 = require("./PodJwksHttpHandler");
class WebHookAuthHttpClient {
    constructor(args) {
        this.jwksKeyGenerator = args.jwksKeyGenerator;
        this.baseUrl = args.baseUrl;
    }
    call(url, options, data, callback) {
        const parsedUrl = url instanceof url_1.URL ? url : new url_1.URL(url);
        this.jwksKeyGenerator
            .getPrivateJwks(PodJwksHttpHandler_1.POD_JWKS_KEY)
            .then((jwks) => {
            const jwk = jwks.keys[0];
            if (!jwk) {
                throw new InternalServerError_1.InternalServerError('No jwk available.');
            }
            parse_1.parseJwk(jwk, 'RS256')
                .then((jwkKeyLike) => {
                const jwtRaw = {
                    htu: parsedUrl.toString(),
                    htm: 'POST',
                };
                new sign_1.SignJWT(jwtRaw)
                    .setProtectedHeader({ alg: 'RS256' })
                    .setIssuedAt()
                    .setIssuer(PathUtil_1.trimTrailingSlashes(this.baseUrl))
                    .setExpirationTime('20m')
                    .sign(jwkKeyLike)
                    .then((signedJwt) => {
                    const augmentedOptions = {
                        ...options,
                        headers: {
                            ...options.headers,
                            authorization: signedJwt,
                        },
                    };
                    const requestClient = parsedUrl.protocol === 'https:' ? https_1.request : http_1.request;
                    const req = requestClient(parsedUrl.toString(), augmentedOptions, callback);
                    req.write(data);
                    req.end();
                })
                    .catch((err) => {
                    throw err;
                });
            })
                .catch((err) => {
                throw err;
            });
        })
            .catch((err) => {
            throw err;
        });
    }
}
exports.WebHookAuthHttpClient = WebHookAuthHttpClient;
//# sourceMappingURL=WebHookAuthHttpClient.js.map