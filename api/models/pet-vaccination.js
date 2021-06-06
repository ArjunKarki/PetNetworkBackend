const mongoose = require('mongoose');
const Schema = mongoose.Schema

const petVaccination = Schema(
    {
        _id: Schema.Types.ObjectId,

        vaccineName: { type: "String" },

        injectionDate: { type: "String" },

        nextInjectionDate: { type: "String" },

        vaccinationNote: { type: "String" },

        caredType: { type: "String" },

        pet: { type: Schema.Types.ObjectId, ref: "Pet" },

        vaccinePic: [{ type: Schema.Types.ObjectId, ref: "Media" }],

        allVaccineName: [{ types: "String" }]

    }
)

module.exports = mongoose.model("PetVaccination", petVaccination);