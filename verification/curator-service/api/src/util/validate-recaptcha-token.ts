import axios from 'axios';
import validateEnv from './validate-env';

export const validateRecaptchaToken = async (token: string): Promise<boolean> =>{
    const env = validateEnv();
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${env.RECAPTCHA_SECRET_KEY}&response=${token}`);
    

    return response.data.success;
};