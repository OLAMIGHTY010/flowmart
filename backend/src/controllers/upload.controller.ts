import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary using individual env vars 
// (or rely on CLOUDINARY_URL if that's what Vercel has)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const generateCloudinarySignature = async (req: Request, res: Response) => {
	try {
		const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = req.body.folder || 'flowmart_products';

		const signature = cloudinary.utils.api_sign_request(
			{
				timestamp,
                folder,
			},
			process.env.CLOUDINARY_API_SECRET as string
		);

		return res.status(200).json({
			success: true,
			signature,
			timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder
		});
	} catch (error) {
		console.error("Cloudinary Signature Error:", error);
		return res
			.status(500)
			.json({ success: false, message: "Internal Server Error" });
	}
};
