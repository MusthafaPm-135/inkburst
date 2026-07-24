const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


// REGISTER USER
exports.register = async (req, res) => {

    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    try {

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users 
            (username, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [username, email, hashedPassword],
            (err, result) => {

                if (err) {
                    return res.status(500).json({
                        success:false,
                        message:"User already exists or database error"
                    });
                }


                res.json({
                    success:true,
                    message:"Registration successful"
                });

            }
        );


    } catch(error){

        res.status(500).json({
            success:false,
            error:error.message
        });

    }

};



// LOGIN USER
exports.login = (req,res)=>{

    const {email,password}=req.body;


    if(!email || !password){
        return res.status(400).json({
            success:false,
            message:"Email and password required"
        });
    }


    db.query(
        "SELECT * FROM users WHERE email=?",
        [email],
        async(err,result)=>{


            if(err){
                return res.status(500).json({
                    success:false,
                    error:err
                });
            }


            if(result.length === 0){

                return res.status(404).json({
                    success:false,
                    message:"User not found"
                });

            }


            const user=result[0];


            const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


            if(!passwordMatch){

                return res.status(401).json({
                    success:false,
                    message:"Incorrect password"
                });

            }


            const token = jwt.sign(
                {
                    id:user.id,
                    email:user.email,
                    role:user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:"7d"
                }
            );
	
	res.cookie("token", token, {
    		httpOnly: true,
    		secure: false,
    		sameSite: "lax",
		path: "/",
    		maxAge: 7 * 24 * 60 * 60 * 1000
	});	


        res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });


        }
    );


};