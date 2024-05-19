const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const jwtToken = require('jsonwebtoken')
require('dotenv').config()

app.use(cors()) 
app.use(express.json())

const connectServer = async () =>{
  try{
        await mongoose.connect(process.env.mongodbUrl) 
        app.listen(process.env.port,()=> console.log("server running..."))
    }catch(e){ 
        console.log("conection failed...")
        process.exit(1)
    }
 } 

connectServer()
const userShema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  username:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  todolist:{
    type:Object
  }
})
const modeling = new mongoose.model("user",userShema)

const middleware = async (req,res,next)=>{
  try{
    const {token} = req.headers
    const verifying = await jwtToken.verify(token,"jwt_token")
    const {usernames} = verifying
    req.body = usernames
    next() 
  }catch(e){
    res.status(401).send("Invalid user")
  }
}

// login api
app.post('/login',async (req,res)=>{
  try{
    const {username,password} = req.body
    const isExist = await modeling.find({username:username})
    if(isExist.length === 0 || isExist[0].password !== password){
     return res.status(400).send("User Data Not Exist please register first")
    }else if(isExist[0].username === username && isExist[0].password === password){
      const payload = {
        usernames:username
      }
      const jwttoken = jwtToken.sign(payload,'jwt_token')
      res.status(200).send(jwttoken)
    }
    }catch(e){
    console.log("Somthing went wrong...")
    process.exit(1)
  }
})

// Register api

app.post('/register', async (req,res)=>{
  try{
    const {name,username,password} = req.body
    const isExist = await modeling.find({username:username})
  
    if (isExist.length === 0 && password.length > 3){  
      const userDetails = {name:name,username:username,password:password,todolist:[]}
      const data = new modeling(userDetails)
      data.save()
     return res.status(200).send("Register Success")
    }
    else if(isExist[0].username === username){
      return res.status(400).send("User already exists")
    }else if (password.length < 4){
      return res.status(400).send("password length must be atleast 4 charecters")
    }

  }catch(e){
  console.log("registration failed")
   return res.status(500).send("Registration failed")
  }
})

// Home api
app.get('/',middleware,async (req,res)=>{
  try{
    const data = await modeling.find({"username":req.body})
    res.send(data)
  }catch(e){
    res.status(400).send("Somthing went wrong")
    process.exit(1) 
  }
})

//Update todolist

app.put('/update/:username',async(req,res)=>{
  try{
    const username = req.params.username
    const todoListData = req.body
    const reslt = await modeling.findOneAndUpdate({"username":username},{"todolist":todoListData})
   res.status(200).send("Save Success")
  }catch(e){
    res.status(400).send("Update Failed")
    process.exit(1)
  }
})