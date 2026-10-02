require("dotenv").config({ path: "../.env" });
const {createClient} = require('redis');

const client = createClient({
    url:process.env.REDIS_URL||"redis://localhost:6379",
});

client.on('error',(err)=>{
console.error('Redis error',err);
});

(async()=>{
    await client.connect();
    console.log('Redis Connected');
})();

module.exports = client;