const app = require('./app.js')
const connectDB = require('./config/db')
const PORT = process.env.PORT || 5000;


const serverStart = async ()=>{
    await connectDB()
    app.listen(PORT, ()=>{
        console.log(`Server is running at port ${PORT}`)
    })
}

serverStart().catch((e)=>{
    console.error(`Unable to start Sever: `, e)
    process.exit(1)
})