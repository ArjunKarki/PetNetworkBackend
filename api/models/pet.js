const mongoose = require('mongoose');
const Schema = mongoose.Schema

const petSchema = Schema(
    {
        _id: Schema.Types.ObjectId,

        owner: { type: Schema.Types.ObjectId, ref: "Owner" },

        petType: { type: "String" },

        petName: { type: "String" },

        petReward: { type: "String" },

        petAge: { type: "String" },

        pNPetId: { type: "String" },

        petDaddyName: { type: "String" },

        petMommyName: { type: "String" },

        petDaddy: { type: Schema.Types.ObjectId, ref: "Pet" },

        petMommy: { type: Schema.Types.ObjectId, ref: "Pet" },

        petBirthDate: { type: "String" },

        petGender: { type: "String" },

        petAddress: { type: "String" },

        petWeight: { type: "String" },

        petDescription: { type: "String" },

        petProPic: { type: Schema.Types.ObjectId, ref: "Media" },

        childList: [{ type: Schema.Types.ObjectId, ref: "Pet" }],

        matchStatus: [{ type: Schema.Types.ObjectId, ref: "MatchStatus" }],

        vaccination: [{ type: Schema.Types.ObjectId, ref: "PetVaccination" }],

        hairCut: [{ type: Schema.Types.ObjectId, ref: "PetHairCut" }],

        reminder: [{ type: Schema.Types.ObjectId, ref: "Reminder" }]

    }
)

module.exports = mongoose.model("Pet", petSchema);