import { Request, Response } from "express";
import { db } from "../../db";
import { corporateProfiles, wallets, users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const getCorporateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id; // Assuming auth middleware sets req.user
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = await db.query.corporateProfiles.findFirst({
      where: eq(corporateProfiles.userId, userId),
    });

    if (!profile) {
      res.status(404).json({ error: "Corporate profile not found" });
      return;
    }

    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    res.status(200).json({ profile, wallet });
  } catch (error) {
    console.error("Error fetching corporate profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateCreditLimitRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    // In a real app, this would trigger an approval workflow.
    // For now, we mock the request success.
    res.status(200).json({ message: "Credit limit increase request submitted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
