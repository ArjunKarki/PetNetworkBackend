const mongoose = require('mongoose');

const ownerCreSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Owner"
    }
})

module.exports=mongoose.model("OwnerCridential",ownerCreSchema);