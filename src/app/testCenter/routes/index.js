import verifyTestCenter from './guards/verifyTestCenter.js';
import { lazyLoading } from '../../../app/shared/router/utils.js';

export const TestCenterDefaultPathName = '/test-center';

export default [
  {
    path: '/test-center',
    component: lazyLoading('testCenter', 'layout/TestCenterLayout'),
    meta: { auth: true },
    beforeEnter: verifyTestCenter({ fromStore: true }),
    children: [
      {
        name: 'TestCenterUploadPage',
        path: 'upload',
        component: lazyLoading('testCenter', 'upload/UploadPage'),
      },
      {
        name: 'TestCenterSessionsManagement',
        path: 'sessions-management',
        component: lazyLoading('testCenter', 'sessions/ManagementPage'),
      },
      {
        name: 'TestCenterUploadLabors',
        path: 'upload/labors/:id',
        component: lazyLoading('testCenter', 'upload/LaborsUploadPage'),
        props: true,
      },
      {
        name: 'TestCenterExamSessions',
        path: 'exam-sessions',
        component: lazyLoading('testCenter', 'exam/SessionsPage'),
      },
      {
        name: 'TestCenterSessionInformation',
        path: 'sessions/info/:id',
        component: lazyLoading('testCenter', 'sessions/SessionInfoPage'),
        props: true,
      },
      {
        name: 'TestCenterTestTakers',
        path: 'sessions/test-takers/:id',
        component: lazyLoading('testCenter', 'sessions/TestTakersPage'),
        props: true,
      },
      {
        name: 'TCPracticalExamEvaluationIndex',
        path: 'sessions/practical-exam-evaluation/:id',
        component: lazyLoading('testCenter', 'sessions/PracticalExamEvaluationPage'),
        props: true,
      },
      {
        name: 'TestCenterPaymentTablePage',
        path: 'payment',
        component: lazyLoading('testCenter', 'payment/PaymentTablePage'),
      },
      {
        name: 'TestCenterPaymentSteps',
        path: 'payment/steps',
        component: lazyLoading('testCenter', 'payment/PaymentStepsPage'),
      },
      {
        name: 'TestCenterPaymentConfirmation',
        path: 'payment/confirmation',
        component: lazyLoading('testCenter', 'payment/PaymentConfirmationPage'),
      },
      {
        name: 'TestCenterTestCentersList',
        path: 'centers',
        component: lazyLoading('testCenter', 'centers/TestCentersListPage'),
      },
      {
        name: 'TestCenterNewTestCenter',
        path: 'centers/add',
        component: lazyLoading('testCenter', 'centers/NewTestCenterPage'),
        beforeEnter: verifyTestCenter({ requireOwner: true }),
      },
      {
        name: 'TestCenterEditTestCenter',
        path: 'centers/:id/edit',
        component: lazyLoading('testCenter', 'centers/EditTestCenterPage'),
        props: true,
        beforeEnter: verifyTestCenter({ requireOwner: true }),
      },
      {
        name: 'TestCenterViewTestCenter',
        path: 'centers/:id',
        component: lazyLoading('testCenter', 'centers/ViewTestCenterPage'),
        props: true,
      },
      {
        name: 'TestCenterTransactionHistoryPage',
        path: 'history',
        component: lazyLoading('testCenter', 'history/TransactionHistoryPage'),
      },
      {
        name: 'TestCenterReports',
        path: 'reports',
        component: lazyLoading('testCenter', 'reports/ReportsPage'),
      },
      {
        name: 'TestCenterCertificateValidation',
        path: 'certificate-validation',
        component: lazyLoading('testCenter', 'certificate/CertificateValidationPage'),
      },
      {
        name: 'PrometricExamStubTestCenter',
        path: 'start-exam-stub',
        component: lazyLoading('testCenter', 'shared/PrometricExamStubPage'),
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: { path: TestCenterDefaultPathName },
      },
    ],
  },
];
