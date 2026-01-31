export const ADMIN_EMAILS = [
  "dhruv.suthar.779@gmail.com", // Replace with your actual email
  "admin@splibiz.com"
];

export const isAdmin = (email) => {
    return ADMIN_EMAILS.includes(email);
};
