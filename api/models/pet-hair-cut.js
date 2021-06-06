const mongoose = require('mongoose')
const Schema = mongoose.Schema

const hairCutSchema = Schema(
    {
        _id: Schema.Types.ObjectId,

        cutDate: { type: "String" },

        caredBy: { type: "String" },

        note: { type: "String" },

        petId: { type: Schema.Types.ObjectId, ref: "Pet" },

        hairCutPic: [{ type: Schema.Types.ObjectId, ref: "Media" }]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("PetHairCut", hairCutSchema)
