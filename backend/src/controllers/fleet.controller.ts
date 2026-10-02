import { Request, Response } from "express";
import { db } from "../../db";
import { fleetProfiles, users } from "../../db/schema";
import { eq } from "drizzle-orm";

export const getFleetProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = await db.query.fleetProfiles.findFirst({
      where: eq(fleetProfiles.userId, userId),
    });

    if (!profile) {
      res.status(404).json({ error: "Fleet profile not found" });
      return;
    }

    res.status(200).json({ profile });
  } catch (error) {
    console.error("Error fetching fleet profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFleetRiders = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a full implementation, riders would have a fleetId linking them to the fleet manager
    res.status(200).json({ riders: [] });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
