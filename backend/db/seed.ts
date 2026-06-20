import { db } from './index';
import { users } from './schema';
import { hashPassword } from '../src/utils/password';

async function seed() {
  console.log('Seeding super admin...');
  try {
    const hashedPassword = await hashPassword('SuperAdmin123!');
    
    await db.insert(users).values({
      fullName: 'System Administrator',
      email: 'admin@flowmart.com',
      password: hashedPassword,
      role: 'super_admin',
      isVerified: true,
      profileCompleted: true,
    });

    console.log('✅ Super admin seeded successfully.');
    console.log('Email: admin@flowmart.com');
    console.log('Password: SuperAdmin123!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  }
}

seed();
