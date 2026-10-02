const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryUpload = (isMultipleFiles, folderName) => {
    return async (req, res, next) => {
        try {
            if (
                (!isMultipleFiles && !req.file) ||
                (isMultipleFiles && (!req.files || req.files.length === 0))
            ) {
                return next();
            }

            const files = isMultipleFiles ? req.files : [req.file];

            const uploadPromises = files.map((file) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: folderName,
                        },
                        (error, result) => {
                            if (error) {
                                return reject(error);
                            }

                            resolve(result);
                        }
                    );

                    stream.end(file.buffer);
                });
            });

            const results = await Promise.all(uploadPromises);

            req.images = results.map((img) => img.secure_url);

            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = cloudinaryUpload;
