const express = require('express')

const router = express.Router()

router.get('/health', (req, res)=>{
    res.json({
        status: "OK",
        message: "Bank eDMS API is healthy",
  });
})

module.exports = router