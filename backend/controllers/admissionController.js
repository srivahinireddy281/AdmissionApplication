const db = require("../config/db")

exports.applyAdmission = (req,res)=>{

const {name,email,course,marks} = req.body

const sql = "INSERT INTO students (name,email,course,marks) VALUES (?,?,?,?)"

db.query(sql,[name,email,course,marks],(err,result)=>{

if(err){
return res.status(500).json({message:"Database Error"})
}

res.json({message:"Application Submitted Successfully"})

})

}