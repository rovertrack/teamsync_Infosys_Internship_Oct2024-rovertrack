import axios from 'axios';

const API = axios.create({ baseURL: process.env.API_BASE_URL }); 



//auth
export const signIn = async ({ email, password }) => await API.post('/user/signin', { email, password });
export const signUp = async ({
    name,
    email,
    password,
}) => await API.post('/user/signup', {
    name,
    email,
    password,
});

export const findUserByEmail = async (email) => await API.get(`/auth/findbyemail?email=${email}`);
export const generateOtp = async (email,name,reason) => await API.get(`/auth/generateotp?email=${email}&name=${name}&reason=${reason}`);
export const verifyOtp = async (otp) => await API.get(`/auth/verifyotp?code=${otp}`);
export const resetPassword = async (email,password) => await API.put(`/auth/forgetpassword`,{email,password});