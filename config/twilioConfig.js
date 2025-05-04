import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (to, body) => {
  try {
    console.log(`Sending SMS to ${to}: ${body}`);
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log('SMS sent successfully:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error.message, error.stack);
    throw error;
  }
};