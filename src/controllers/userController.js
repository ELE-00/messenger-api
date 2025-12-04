const cloudinary = require('cloudinary').v2;

function getUserData(prisma){
  return async (req, res) => {
    const userId = req.user.id;

    console.log("Received userID: " + userId)
    
    try{
    const user = await prisma.user.findUnique({where: {id: userId}});

    res.json(user)

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to get all users"})

    }
  }
}

function sendUserData(prisma){
  return async (req, res) => {
    const userId = req.user.id;
    const {name, bio} = req.body;

    console.log("req.user:", req.user);
    console.log("req.body:", req.body);
        
    try{
    const user = await prisma.user.update(
        {where: {
            id: userId
        },
        data: {name: name, bio: bio}});

    res.json(user)

    } catch (err) {
      console.log(err)
      res.status(500).json({error: "Failed to update user data"})

    }
  }
}

//upload files
function uploadProfilePic(prisma) {
    return async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: "profile_pics",
            resource_type: "image"
        });

        // Save to Prisma
        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {
                profilepic: uploadResult.secure_url,
            }
        });

        return res.json({
            success: true,
            profilepic: uploadResult.secure_url,
            user: updatedUser
        });

        } catch (err) {
            console.error(err);
            console.log("Upload failed");
        }
    }
}


module.exports = {getUserData, sendUserData, uploadProfilePic}