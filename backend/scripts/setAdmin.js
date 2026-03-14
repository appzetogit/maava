import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Admin model
import Admin from '../modules/admin/models/Admin.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const setAdmin = async () => {
    try {
        const newEmail = 'maava1238@gmail.com';
        const newPassword = '123456';
        
        console.log(`Setting admin credentials for: ${newEmail}`);

        // Try to find the admin by email
        let admin = await Admin.findOne({ email: newEmail.toLowerCase() });

        if (admin) {
            console.log('Admin already exists. Updating password...');
            admin.password = newPassword;
            await admin.save();
            console.log('✅ Password updated successfully!');
        } else {
            console.log('Admin not found. Creating new admin...');
            admin = new Admin({
                name: 'Maava Admin',
                email: newEmail.toLowerCase(),
                password: newPassword,
                role: 'super_admin',
                isActive: true,
                phoneVerified: false,
                permissions: [
                    'dashboard_view',
                    'admin_manage',
                    'restaurant_manage',
                    'delivery_manage',
                    'order_manage',
                    'user_manage',
                    'report_view',
                    'settings_manage',
                    'payment_manage',
                    'campaign_manage'
                ]
            });
            await admin.save();
            console.log('✅ New admin created successfully!');
        }

        console.log('Admin Details:');
        console.log('- ID:', admin._id);
        console.log('- Email:', admin.email);
        console.log('- Role:', admin.role);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting admin:', error.message);
        process.exit(1);
    }
};

// Run the script
connectDB().then(() => {
    setAdmin();
});
