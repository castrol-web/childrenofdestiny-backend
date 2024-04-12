import mongoose from "mongoose";
const KidsSchema = new mongoose.Schema({
    photo: {
        type: String,
        required: true,
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    hobby: {
        type: String,
        required: true
    },
    Age: {
        type: Number,
        required: true
    },
    DOB: {
        type: Date,
        required: true,
    },
    Siblings: {
        type: String,
        default: "N/A",
        required: true,
    },
    Sponsored: {
        type: Boolean,
        required: true,
        default: false,
    },
    Ambition: {
        type: String,
        required: true,
    },
    EducationLevel: {
        type: String,
        required: true
    },
    Class: {
        type: String,
        default: "N/A",
    },
    LifeStory: {
        type: String,
        required: true
    }
},
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        }
    })

export default mongoose.model("Kid", KidsSchema);