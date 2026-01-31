export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map(email => email.trim())
  .filter(Boolean); // Remove empty strings if any Let's keep it safe.

export const isAdmin = (email) => {
    return ADMIN_EMAILS.includes(email);
};
