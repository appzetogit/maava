import axios from 'axios';

async function testLocalSendOTP() {
    try {
        console.log('Testing local send-otp endpoint...');
        const response = await axios.post('http://localhost:5000/api/auth/send-otp', {
            phone: '9109992290', // A real-looking number
            purpose: 'login'
        });
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
    } catch (error) {
        console.error('Error Status:', error.response?.status);
        console.error('Error Data:', error.response?.data);
    }
}

testLocalSendOTP();
