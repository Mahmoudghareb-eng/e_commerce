require("dotenv").config({ path: "../.env" });
const express = require('express');
const userRoute = require('./routes/user.route');
const productRoute = require('./routes/product.route');
const orderRoute = require('./routes/order.route');
const orderItemRoute = require('./routes/orderItem.route');
const cartRoute = require('./routes/cart.route');
const cartItemRoute = require('./routes/cartItem.route');
const checkout = require('./routes/checkout.route');

const app = express();
app.use(express.json());

app.get('/',(req,res)=>{
    res.json({msg:'welcome to api'});
 });

app.use('/api/users',userRoute);
app.use('/api/products',productRoute);
app.use('/api/orders',orderRoute);
app.use('/api/orders/items',orderItemRoute);
app.use('/api/cart/items',cartItemRoute);
app.use('/api/cart',cartRoute);
app.use('/api/checkout',checkout);

app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});


const port = process.env.PORT || 3000;

app.listen(port,()=>console.log(`server is running on ${port}`));