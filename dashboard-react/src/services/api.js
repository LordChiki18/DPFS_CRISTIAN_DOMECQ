import axios from 'axios';

const API_BASE = 'http://localhost:3000/api'; // Cambia si usás otro puerto

export const fetchProducts = () => axios.get(`${API_BASE}/products`);
export const fetchUsers = () => axios.get(`${API_BASE}/users`);
export const fetchProductDetail = (id) => axios.get(`${API_BASE}/products/${id}`);
export const fetchUserDetail = (id) => axios.get(`${API_BASE}/users/${id}`);
