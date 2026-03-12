Module: AdminPanel
Error: RevenueSparkline is not defined

--- Stack ---
ReferenceError: RevenueSparkline is not defined
    at AdminDashboard (http://localhost:4028/src/pages/admin/AdminDashboard.jsx:1082:34)
    at Object.react_stack_bottom_frame (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:18486:20)
    at renderWithHooks (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:5492:24)
    at updateFunctionComponent (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:7327:21)
    at beginWork (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:8346:201)
    at runWithFiberInDEV (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:750:72)
    at performUnitOfWork (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:12471:98)
    at workLoopSync (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:12330:11)
    at renderRootSync (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:12313:15)
    at performWorkOnRoot (http://localhost:4028/node_modules/.vite/deps/chunk-6M53Q6M7.js?v=5ebcce40:11724:37)

--- Component Stack ---

    at AdminDashboard (http://localhost:4028/src/pages/admin/AdminDashboard.jsx:79:20)
    at div (<anonymous>)
    at PageTransition (http://localhost:4028/src/components/PageTransition.jsx:26:3)
    at Suspense (<anonymous>)
    at Outlet (http://localhost:4028/node_modules/.vite/deps/react-router-dom.js?v=5ebcce40:661:10)
    at div (<anonymous>)
    at main (<anonymous>)
    at div (<anonymous>)
    at AdminLayout (http://localhost:4028/src/pages/admin/AdminLayout.jsx:150:3)
    at ErrorBoundary (http://localhost:4028/src/components/ErrorBoundary.jsx:44:5)
    at Outlet (http://localhost:4028/node_modules/.vite/deps/react-router-dom.js?v=5ebcce40:661:10)
    at PrivateRoute (http://localhost:4028/src/components/PrivateRoute.jsx:23:36)
    at Routes (http://localhost:4028/node_modules/.vite/deps/react-router-dom.js?v=5ebcce40:721:5)
    at ErrorBoundary (http://localhost:4028/src/components/ErrorBoundary.jsx:44:5)
    at main (<anonymous>)
    at Routes (http://localhost:4028/node_modules/.vite/deps/react-router-dom.js?v=5ebcce40:721:5)
    at Router (http://localhost:4028/node_modules/.vite/deps/react-router-dom.js?v=5ebcce40:668:15)
    at BrowserRouter (http://localhost:4028/node_modules/.vite/deps/react-router-dom.js?v=5ebcce40:1241:5)
    at Routes (<anonymous>)
    at NotificationProvider (http://localhost:4028/src/contexts/NotificationContext.jsx:36:40)
    at ErrorBoundary (http://localhost:4028/src/components/ErrorBoundary.jsx:44:5)
    at App (<anonymous>)
    at AppProvider (http://localhost:4028/src/contexts/AppContext.jsx:79:31)
    at FirebaseAuthProvider (http://localhost:4028/src/providers/FirebaseAuthProvider.jsx:100:48)
    at ActiveAuthProvider (http://localhost:4028/src/providers/index.jsx:19:38)
    at LanguageProvider (http://localhost:4028/src/contexts/LanguageContext.jsx:29:36)