import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is required");
}

export const apiClient = axios.create({
  baseURL: API_URL,
});
