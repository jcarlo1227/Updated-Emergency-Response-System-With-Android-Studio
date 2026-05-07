import bcrypt from 'bcryptjs';
import { Admin } from '../models/index.js';
import { env } from '../config/env.js';

export async function seedAdmin(): Promise<void> {
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await Admin.findOne({ email });
  const hashed = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  if (existing) {
    if (env.NODE_ENV !== 'production') {
      existing.password = hashed;
      existing.name = env.ADMIN_NAME;
      existing.isActive = true;
      await existing.save();
      console.log(`Admin re-synced (dev): ${email}`);
    } else {
      console.log(`Admin already exists: ${email}`);
    }
    return;
  }

  await Admin.create({
    email,
    password: hashed,
    name: env.ADMIN_NAME,
    isActive: true,
  });
  console.log(`Admin seeded: ${email}`);
}
