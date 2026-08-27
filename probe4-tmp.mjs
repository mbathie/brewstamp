import { MongoClient } from 'mongodb';
const c = new MongoClient(process.env.PROD_MONGO);
await c.connect();
const cust = await c.db('brewstamp').collection('customers')
  .findOne({ cookieId: process.argv[2] }, { projection: { name:1, email:1, createdAt:1 } });
console.log(cust ? cust._id.toString() : 'NOT FOUND');
await c.close();
