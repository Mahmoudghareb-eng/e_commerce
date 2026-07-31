require("dotenv").config({ path: "../.env" });
const express = require('express');
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const swaggerUI = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const cookieParser = require("cookie-parser");
const userRoute = require('./routes/user.route');
const productRoute = require('./routes/product.route');
const orderRoute = require('./routes/order.route');
const orderItemRoute = require('./routes/orderItem.route');
const cartRoute = require('./routes/cart.route');
const cartItemRoute = require('./routes/cartItem.route');
const couponRoute = require('./routes/coupons.route');
const checkout = require('./routes/checkout.route');
const errorHandler = require("./middleware/error.middleware");

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

app.use('/api/users',userRoute);
app.use('/api/products',productRoute);
app.use('/api/orders',orderRoute);
app.use('/api/orders/items',orderItemRoute);
app.use('/api/cart/items',cartItemRoute);
app.use('/api/cart',cartRoute);
app.use('/api/coupons',couponRoute);
app.use('/api/checkout',checkout);

const swaggerDoc = require('./config/swaggerDoc');
swaggerDoc(app);

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port,()=>console.log(`server is running on ${port}`));