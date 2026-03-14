const mysql = require("mysql2")

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "admission_db"
})

db.connect((err)=>{
  if(err){
    console.log(err)
  }else{
    console.log("Database Connected")
  }
})

module.exports = db