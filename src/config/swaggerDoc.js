const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yaml");

const swaggerPath = path.join(__dirname, "../docs/swagger.yml")

console.log(swaggerPath);

const file = fs.readFileSync(swaggerPath, "utf8");
const swaggerDocument = YAML.parse(file);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};