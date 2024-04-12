import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import userRoutes from "./routes/Users.js";
import dotenv from "dotenv";
// import path from "path";

dotenv.config();
const app = express();

// // Manually define __dirname
// const __dirname = path.resolve();

// Middleware
app.use(cors({
    origin: "https://childrenofdestinyfoundation.onrender.com",
    
    credentials: true
}));
// Middleware to allow CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://childrenofdestinyfoundation.onrender.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
  });
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

// // Serve static files from the 'frontend/build' directory
// app.use(express.static(path.join(__dirname, 'build')));

// Database connection
const connection_url = process.env.MONGOOSE_CONNECTION;
try {
    await mongoose.connect(connection_url);
    console.log("DB connection successful");
} catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1);
}

// Routes
app.use("/api/users", userRoutes);

// // Serve index.html for all other routes
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname,'build', 'index.html'));
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
const PORT = process.env.PORT || 8050;
app.listen(PORT, '0.0.0.0', function (err) {
    if (err) {
        console.error("Error starting server:", err);
        process.exit(1);
    }
    console.log(`Listening on localhost:${PORT}`);
});
