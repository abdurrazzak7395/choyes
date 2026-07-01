// lightweight lazy loader matching usage lazyLoading('testCenter', 'payment/PaymentPage')
export const lazyLoading = (group, page) => {
  return () => import(`@/app/${group}/${page}.vue`);
};
