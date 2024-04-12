import express from "express";
import Kids from "../models/Kids.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import crypto from "crypto";
import dotenv from "dotenv";
import cors from "cors";
import Gallery from "../models/Gallery.js";
import { transporter, mailOptions } from "../nodemailer.js";
dotenv.config();

const router = express.Router();
// Enable CORS for all routes
router.use(cors());

//s3 credentials
const accessKey = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;

//s3 object
const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey
    },
    region: region
});

//storage for image in memory storage
const storage = multer.memoryStorage();

//generate random image names function
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

//upload object for the image 
const upload = multer({ storage: storage });

// Gallery posting of pictures maximum 10
router.post("/post-pictures", upload.array('images', 10), async (req, res) => {
    try {
        // Checking for image upload buffer
        if (!req.files || req.files.length === 0) {
            return res.status(404).json({ message: "No files found" });
        }

        const uploadedPictures = [];

        // Upload each file to AWS S3
        for (const file of req.files) {
            const pictures = randomImageName();
            const params = {
                Bucket: bucketName,
                Key: pictures,
                Body: file.buffer,
                ContentType: file.mimetype
            };
            const command = new PutObjectCommand(params);
            await s3.send(command);
            uploadedPictures.push(pictures);
        }

        // Save uploaded picture paths to the database
        const newGallery = new Gallery({ images: uploadedPictures });
        await newGallery.save();

        res.status(201).json({ message: "Uploaded successfully" });

    } catch (error) {
        // Multer errors
        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "File size too large. Maximum allowed size is 10MB." });
            }
            if (error.code === "LIMIT_UNEXPECTED_FILE") {
                return res.status(400).json({ message: "Unexpected field. Please check your file upload." });
            }
        }
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


const CONTACT_MESSAGE_FIELDS = {
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
}

const generateEmailContent = async (data) => {
    //destructuring data
    const htmlData = Object.entries(data).reduce(
        //mapping data to contact message fields object
        (str, [key, val]) => {
            return str += `<div style="margin-bottom: 20px;">
                                <h2 style="margin-bottom: 5px;">${CONTACT_MESSAGE_FIELDS[key]}</h2>
                                <p>${val}</p>
                            </div>`;
        }, "");

    //returning an html template to be viewed in the email
    return {
        html: `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Contact Us Message</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                        }
                        h2 {
                            color: #333;
                            margin-top: 0;
                        }
                        p {
                            color: #666;
                            margin-bottom: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            border: 1px solid #ccc;
                            border-radius: 10px;
                            background-color: #f9f9f9;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>New Contact Us Message</h1>
                        ${htmlData}
                    </div>
                </body>
                </html>`
    }
}

//contact us 
router.post("/contact-us", async (req, res) => {
    try {
        const data = req.body;
        if (!data.name || !data.email || !data.subject || !data.message) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Generate HTML content for the email
        const emailContent = await generateEmailContent(data);

        await transporter.sendMail({
            ...mailOptions,
            ...emailContent,
            subject: data.subject,
        });

        res.status(201).json({ message: `Thank you for ${data.name} contacting us, we will respond to you soon!` });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});





//get pictures for the gallery
router.get("/gallery-pictures", async (req, res) => {
    try {
        const imageArray = await Gallery.find();
        if (!imageArray) {
            return res.status(404).json({ message: "no images uploaded yet" });
        }

        const images = await Promise.all(imageArray.map(async (imageEntry) => {
            return Promise.all(imageEntry.images.map(async (imageId) => {
                return await generateSignedUrl(imageId);
            }));
        }));

        res.status(200).json({ images });

    } catch (error) {
        console.error("Error fetching gallery pictures:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


//getting random kids
router.get("/random-kids", async (req, res) => {
    try {
        const kids = await Kids.find({});
        if (!kids) {
            return res.status(404).json({ message: "no kids found" });
        }
        const selectedKids = [];
        const kidsArray = []

        //copy of the original string to check unselected kid
        const remainingKids = [...kids];
        for (let i = 0; i < 3 && remainingKids.length >0; i++) {
            //selecting kids at random up to 
            const randomIndex = Math.floor(Math.random() * remainingKids.length);
            const selectedKid = remainingKids.splice(randomIndex,1)[0];
            selectedKids.push(selectedKid);
            //generate signed url
            const url = await generateSignedUrl(selectedKid.photo);
             //push kid object to kidArry
             kidsArray.push({kid:selectedKid,photo:url});
        }
        res.status(201).json({kidsArray});
    } catch (error) {
        console.error("Error fetching gallery pictures:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
})

//all cod kids
router.post("/kids", upload.single('photo'), async (req, res) => {
    try {
        const { firstname, hobby, gender, lastname, Age, DOB, Siblings, Sponsored, Ambition, EducationLevel, Class, LifeStory } = req.body;
        if (!firstname || !lastname || !Age || !gender || !DOB || !Siblings || !Sponsored || !Ambition || !EducationLevel || !LifeStory) {
            return res.status(400).json({ message: "All fields required" });
        }
        const photo = randomImageName();
        //checking for image upload buffer
        if (!req.file || !req.file.buffer) {
            return res.status(404).json({ message: "file not found" });
        }

        //params to be sent to aws s3
        const params = {
            Bucket: bucketName,
            Key: photo,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }

        //upload to s3 
        const command = new PutObjectCommand(params);
        await s3.send(command);

        //new kid
        const newKid = new Kids({
            firstname,
            gender,
            lastname,
            hobby,
            photo,
            Age,
            DOB,
            Siblings,
            Sponsored,
            Ambition,
            EducationLevel,
            Class,
            LifeStory
        });
        //saving to database
        await newKid.save();

        res.status(201).json({ message: "successfully uploaded to Children of Destiny" });
    } catch (error) {
        //Multer errors
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_TYPES") {
            return res.status(400).json({ message: "Invalid file type.Please upload a valid image" });
        }
        console.log(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});




//fetching kids from database
router.get("/cod-kids", async (req, res) => {
    try {
        const kids = await Kids.find({});
        if (!kids) {
            return res.status(404).json({ message: "no kids found" });
        }
        //kids array to be sent
        const kidArray = [];
        const KidsPromises = kids.map(async kid => {
            const url = await generateSignedUrl(kid.photo);
            //associate each kid with their photos
            kidArray.push({ kid, photo: url });
        });
        await Promise.all(KidsPromises);
        res.status(201).json({ kidArray });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/kid-details/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const kid = await Kids.findById(id);
        if (!kid) {
            return res.status(404).json({ message: "kid not found" });
        }
        //generate url for that kid
        const url = await generateSignedUrl(kid.photo);
        // Combine kid details and URL into a single object
        const responseData = {
            kid,
            url,
        };
        res.status(200).json(responseData);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



//fuction to get signed url from aws
async function generateSignedUrl(imageUrl) {
    // Object params to fetch image 
    const getObjectParams = {
        Bucket: bucketName,
        Key: imageUrl
    };

    // Command to fetch the image from AWS
    const command = new GetObjectCommand(getObjectParams);
    // Fetching the URL for the image
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    return url;
}


export default router;