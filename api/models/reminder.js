const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ReminderSchema = Schema(
    {
        _id: mongoose.Types.ObjectId,

        pet: { type: Schema.Types.ObjectId, ref: "Pet" },

        date: { type: "String" },

        type: { type: "String" }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Reminder", ReminderSchema)