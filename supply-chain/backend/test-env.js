const dotenv = require('dotenv');
const result = dotenv.config({ path: './.env' });
console.log('Dotenv result:', result);
if (result.error) {
  console.error('Dotenv error:', result.error);
}
console.log('Process env:', {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  NODE_ENV: process.env.NODE_ENV
});