const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());

export default isEmailValid;
