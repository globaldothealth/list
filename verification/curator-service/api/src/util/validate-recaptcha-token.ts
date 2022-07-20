import axios from 'axios';

export const validateRecaptchaToken = async (token: string): Promise<boolean> =>{
    const secret = "";
    const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`);
    

    return response.data.success;
};