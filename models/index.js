const dbConfig=require('../configs/mongoose.js')
const mongoose = require("mongoose");

mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;

db.Users = require("./User.js")(mongoose);
db.Productss=require("./product.js")(mongoose)

module.exports = db;