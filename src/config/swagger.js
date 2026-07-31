require("dotenv").config({ path: "../.env" });
const swaggerJsDoc = require("swagger-jsdoc");

const port = process.env.PORT || 3000;

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "E-Commerce API",
            version: "1.0.0",
            description: "API Documentation for E-Commerce Backend"
        },

        servers: [
            {
                url: `http://localhost:${port}`
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },

        security: [
            {
                bearerAuth: []
            }
        ]
    },

    apis: [__dirname + "/../routes/*.js"]
};

const swaggerSpec = swaggerJsDoc(options);

console.log(swaggerSpec.paths);

module.exports = swaggerSpec;