const mongoose = require('mongoose')
const dns = require('node:dns')
const Approval = require('../models/Approval')

dns.setServers(['1.1.1.1', '8.8.8.8']);

const connectDB = async ()=>{
    if(!process.env.MONGO_URI){
        throw new Error('MONGO_URI not configured')
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        try {
            await Approval.collection.dropIndex('voucher_1_stage_1')
            console.log('Removed obsolete approval stage index')

        } catch (indexError) {

            if (indexError.codeName !== 'IndexNotFound' && indexError.code !== 27) throw indexError
        }

        await Approval.createIndexes()
        console.log('DB Connection Successful')
        
    } catch (error) {
        throw error
    }

}

module.exports = connectDB