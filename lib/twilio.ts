import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
export const twilioPhone = process.env.TWILIO_PHONE_NUMBER

// Initialize twilio only if credentials exist
export const twilioClient = (accountSid && authToken) 
    ? twilio(accountSid, authToken) 
    : null
