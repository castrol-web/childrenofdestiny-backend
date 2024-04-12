import mongoose from "mongoose";

const gallerySchema = mongoose.Schema({
    images:[{
        type:String
    }]
})


export default mongoose.model("Gallery",gallerySchema);