const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notiSchema = new Schema({
    _id: Schema.Types.ObjectId,
    createdBy: { type: Schema.Types.ObjectId, ref: "Owner" },
    pet: { type: Schema.Types.ObjectId, ref: "Pet" },
    type: String,
    media: { type: Schema.Types.ObjectId, ref: "Media" },
    dataId: String,
    isSavedInClient: { type: Boolean, default: false }
},
    {
        timestamps: true
    })

module.exports = mongoose.model("Notification", notiSchema)