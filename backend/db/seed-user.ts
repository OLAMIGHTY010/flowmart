import { db } from './index';
import { users } from './schema';
import { hashPassword } from '../src/utils/password';

async function seedTestUser() {
  console.log('⏳ Seeding test user...');

  try {
    const plainPassword = 'password123'; // Easy password for testing
    const hashedPassword = await hashPassword(plainPassword);

    const [newUser] = await db.insert(users).values({
      fullName: 'Test Admin',
      email: 'admin@flowmart.com',
      password: hashedPassword,
      role: 'super_admin', // Based on your roleEnum
      isVerified: true,
      profileCompleted: true,
      status: 'active'
    }).returning();

    console.log('✅ Test user seeded successfully!\n');
    console.log('--- 🔑 Login Credentials ---');
    console.log(`Email:    ${newUser.email}`);
    console.log(`Password: ${plainPassword}`);
    console.log(`Role:     ${newUser.role}`);
    console.log('----------------------------\n');

  } catch (error) {
    console.error('❌ Error seeding user:', error);
  } finally {
    process.exit(0); // Exit the process once done
  }
}

seedTestUser();
