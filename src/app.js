require("dotenv").config({ path: "../.env" });
const express = require('express');
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const swaggerSpec = require("./config/swagger");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const userRoute = require('./routes/user.route');
const productRoute = require('./routes/product.route');
const orderRoute = require('./routes/order.route');
const orderItemRoute = require('./routes/orderItem.route');
const cartRoute = require('./routes/cart.route');
const cartItemRoute = require('./routes/cartItem.route');
const couponRoute = require('./routes/coupons.route');
const checkout = require('./routes/checkout.route');
const { errorHandler } = require("./middleware/error.middleware");
const logger = require("./config/logger");

const app = express();
app.use(
    helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);
app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.get('/',(req,res)=>{
    res.json({msg:'welcome to api'});
 });
app.use(
    morgan("combined", {
        stream: {
            write: (message) => logger.info(message.trim())
        }
    })
);

app.use('/api/v1/users',userRoute);
app.use('/api/v1/products',productRoute);
app.use('/api/v1/orders',orderRoute);
app.use('/api/v1/orders/items',orderItemRoute);
app.use('/api/v1/cart/items',cartItemRoute);
app.use('/api/v1/cart',cartRoute);
app.use('/api/v1/coupons',couponRoute);
app.use('/api/v1/checkout',checkout);

const swaggerDoc = require('./config/swaggerDoc');
swaggerDoc(app);

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

app.use(errorHandler);

module.exports = app;