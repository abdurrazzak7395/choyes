import verifyTestCenter from './verifyTestCenter';

export default function verifyTestCenterV3(opts) {
  const guard = verifyTestCenter(opts);
  return (to, from, next) => {
    guard(to).then(result => {
      if (result === true) return next();
      if (typeof result === 'object') return next(result);
      next(false);
    }).catch(err => {
      console.error(err);
      next({ path: '/' });
    });
  };
}
