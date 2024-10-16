const express = require("express");
const router = express.Router();
const {User} = require("../db/index"); 
const { validateUserSignup, validateUserSignin, validateUserUpdate, validateUserVerify, tokenValidation } = require("../middlewares/UserMiddlewares");
const jwt = require("jsonwebtoken");
const {sendOtpEmail} = require("../mailer/OtpMailer")
require('dotenv').config();
const bcrypt = require("bcrypt");

router.get("/my-projects",(req,res)=>{
})

router.get("/my-tasks",(req,res)=>{
})

router.post("/signup", validateUserSignup, async (req, res) => {
    try {
        // Destructure the validated data from the request body
        const { name, email, password } = req.body;

        // Hash the password before storing it
        // You can use bcrypt or another library to hash the password
        const bcrypt = require("bcrypt");
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Create a new user instance
        const newUser = new User({
            name:name.trim(),
            email:email.trim(),
            password_hash,
            // Registration OTP will be generated by the schema's default value
        });

        // Save the user to the database
        await newUser.save();

        // Send a success response
        return res.status(201).json({
            message: "User registered successfully.",
            email: newUser.email
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({
            errors: ["Internal server error."],
        });
    }
});


router.post("/signin", validateUserSignin,(req,res)=>{
    // all checks done create a jwt token using user's email and send it in response 
    const { email } = req.body;
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "12h",
    });
    return res.json({
        message: "User signed in successfully.",
        token,
    });
})

router.put("/edit-user", validateUserUpdate, async (req, res) => {
    try {
        //decode jwt token in header to get original email
        const token = req.headers.authorization;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        //find user with that email in db
        const updateUser= await User.findOne({ email })
        //if no user found send error
        if (!updateUser) {
            return res.status(400).json({
                errors: ["No user with this email exists."],
            });
        }
        //update details
        updateUser.name=req.body.name;
        updateUser.email=req.body.email;
        //store hashed password
        updateUser.password_hash = await bcrypt.hash(req.body.password, 10);
        //save updated user
        await updateUser.save();
        //if user updated the email compare email in jwt and req body, then send new token to user as well
        if(email!==req.body.email){
            const token = jwt.sign({ email:req.body.email }, process.env.JWT_SECRET, {
                expiresIn: "12h",
            });
            return res.json({
                message: "User updated successfully.",
                token,
            });
        }
        //send success response
        return res.status(200).json({
            message: "User updated successfully.",
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
            errors: ["Internal server error."],
        });
    }
});

router.post("/verify",async (req,res)=>{
    //extract email from req body
    const {email}=req.body;
    if(!email){
        return res.status(400).json({
            errors: ["Email is required."],
        });
    }
    //find user with that email
    const user=await User.findOne({email});
    //if no user found send error
    if(!user){
        return res.status(400).json({
            errors: ["No user with this email exists."],
        });
    }
    //if user found check if his state is not blocked
    if(user.state==="blocked"){
        return res.status(400).json({
            errors: ["User is blocked."],
        });
    }
    //if user state is verified send message already verified
    if(user.state==="verified"){
        return res.status(400).json({
            errors: ["User is already verified."],
        });
    }
    //if user state is pending send otp to user email
    //send otp to user email
    await sendOtpEmail(user.email,user.registration_otp,"Your One Time Password(OTP) for verifying your account is: ");
    return res.status(200).json({
        message: "OTP sent to user's email.",
    });
    
})

router.put("/verify",validateUserVerify, async (req,res)=>{
    //extract email and otp from req body
    const {email,registerOtp}=req.body;
    //find user with that email
    const userOne=await User.findOne({email});
    //if no user found send error
    if(!userOne){
        return res.status(400).json({
            errors: ["No user with this email exists."],
        });
    }
    //if user found check if his state is not blocked
    if(userOne.state==="blocked"){
        return res.status(400).json({
            errors: ["User is blocked."],
        });
    }
    //if user state is verified send message already verified
    if(userOne.state==="verified"){
        return res.status(400).json({
            errors: ["User is already verified."],
        });
    }
    //if otp is correct update user state to verified
    if(userOne.registration_otp===registerOtp){
        userOne.state="verified";
        //generate a new otp of 6 digit  number and make it string and update that otp in db
        userOne.registration_otp=Math.floor(100000 + Math.random() * 900000).toString();
        await userOne.save();
        return res.status(200).json({
            message: "User verified successfully.",
        });
    }
})

router.get("/profile/:id", tokenValidation, async (req,res)=>{
    try {
        const id=req.params.id;
        const RequestedUser=await User.findOne({id})
        if(!RequestedUser){
            return res.status(400).json({
                errors: ["No user with this id exists."],
            });
        }
        return res.status(200).json({
            id:RequestedUser.id,
            name:RequestedUser.name,
            email:RequestedUser.email,
            state:RequestedUser.state,
            created_at:RequestedUser.created_at,
            last_login:RequestedUser.last_login
        });   
    } catch (error) {
        console.error("Error getting user:", error);
        return res.status(500).json({
            errors: ["Internal server error."],
        });
    }

})



module.exports = router;
