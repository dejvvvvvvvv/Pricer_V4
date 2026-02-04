/**
 * AdminWidgetBuilder — thin wrapper that delegates to the new BuilderPage.
 * Route: /admin/widget/builder/:id (rendered outside AdminLayout for fullscreen).
 */
import BuilderPage from './builder/BuilderPage';

export default function AdminWidgetBuilder() {
  return <BuilderPage />;
}
