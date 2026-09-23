const department = require('../models/Department')

const getDepartments = async(req, res)=>{
    try {
        const departments = await department.find()
        res.status(200).json({
            success: true,
            data: departments
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch the departments'
        })
    }
}

const createDepartment = async(req, res)=>{
    try{
        const { name, code}  = req.body;
        const dept = await department.findOne({ code: (code || "")})

        if(dept) return res.status(401).json({success: false, message: "Department Already exist"})

        const newDept = await department.create( { name, code} )
        res.status(201).json({
            success: true,
            data: newDept
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: 'Failed to create new department'
        })
    }
} 

const deleteDepartment = async(req, res)=>{
    try{
        const id = req.params.id
        const dept = await department.findByIdAndDelete(id)

        if(!dept) return res.status(404).json({success: false, message: "The department not found"})
        
        res.status(200).json({
            success: true,
            message: "Successfully deleted the department"
        })
    }
    catch(error){
        return res.status(500).json({
            success: false,
            message: "Failed to delete department"
        })
    }
}

module.exports = { getDepartments, createDepartment, deleteDepartment }