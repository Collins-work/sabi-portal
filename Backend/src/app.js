const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const index = require('./routes/index.routes')
const department = require('./routes/departments.routes')
const pv = require('./routes/pv.routes')
const login = require('./routes/login.routes')
const admin = require('./routes/admin.routes')
const approval = require('./routes/approval.routes')
const profile = require('./routes/profile.routes')
const errorHandler = require('./middlewares/error.middleware')
const app = express()

const corsOption = {
    origin: ['http://localhost:5173', 'https://desirable-alignment-production-267d.up.railway.app','https://sabimfb.com'],
    optionsSuccessStatus: 200
};

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(helmet())
app.use(cors(corsOption))

app.use('/api', index)
app.use('/api', department)
app.use('/api', pv)
app.use('/api/auth', login)
app.use('/api/auth', profile)
app.use('/api/admin', admin)
app.use('/api', approval)


app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler)

module.exports = app;