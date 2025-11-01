// src/lib/api.ts
import axios from 'axios';
import { auth } from '@/lib/firebase';

// --- Define your Microservice Base URLs ---
const PRODUCT_SERVICE_URL = 'https://product-service-821973944217.asia-southeast1.run.app/api';
const BILLING_SERVICE_URL = 'https://billing-service-821973944217.asia-southeast1.run.app/api';
const VENDOR_SERVICE_URL = 'https://vendor-service-821973944217.asia-southeast1.run.app/api';
const REPORT_SERVICE_URL = 'https://report-service-821973944217.asia-southeast1.run.app/api';
// ------------------------------------------

// --- Create a separate Axios instance for each service ---
const productService = axios.create({ baseURL: PRODUCT_SERVICE_URL });
const billingService = axios.create({ baseURL: BILLING_SERVICE_URL });
const vendorService = axios.create({ baseURL: VENDOR_SERVICE_URL });
const reportService = axios.create({ baseURL: REPORT_SERVICE_URL });
// ---------------------------------------------------------

// --- Create a reusable interceptor to attach the auth token ---
const authInterceptor = async (config: any) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// --- Apply the interceptor to every instance ---
productService.interceptors.request.use(authInterceptor);
billingService.interceptors.request.use(authInterceptor);
vendorService.interceptors.request.use(authInterceptor);
reportService.interceptors.request.use(authInterceptor);
// -----------------------------------------------

// --- Export each service instance for use in your components ---
export {
  productService,
  billingService,
  vendorService,
  reportService,
};