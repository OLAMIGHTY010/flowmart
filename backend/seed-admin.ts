import { db } from './db';
import { users } from './db/schema';
import { hashPassword } from './src/utils/password';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
dotenv.config();

const seed = async () => {
  try {
    const fullName = "Adeyemi Olusola";
    const email = "admin@flowmart.com";
    const defaultPassword = "SuperAdmin2026!";
    const phone = "09012345678";
    
    
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existing.length > 0) {
      console.log(`User ${email} already exists! Updating role, status, verification, and resetting password to default...`);
      const hashedPassword = await hashPassword(defaultPassword);
      await db.update(users).set({ 
        role: 'super_admin',
        password: hashedPassword,
        isVerified: true,
        profileCompleted: true,
        status: 'active',
        forcePasswordChange: true
      }).where(eq(users.email, email));
      console.log('Admin user updated and password reset successfully.');
      process.exit(0);
    }

    const hashedPassword = await hashPassword(defaultPassword);

    await db.insert(users).values({
      fullName,
      email,
      password: hashedPassword,
      role: 'super_admin',
      phone: '08012345678',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      isVerified: true,
      profileCompleted: true,
      status: 'active',
      forcePasswordChange: true
    });

    console.log(`Successfully seeded super admin!`);
    console.log(`Name: ${fullName}`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`They will be forced to change password upon first login.`);
    
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
};

seed();
