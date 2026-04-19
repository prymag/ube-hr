import { useNavigate } from 'react-router-dom';
import { Button } from '@ube-hr/ui';

export function NoPermissionPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
      <p className="text-sm text-gray-500">
        You don't have permission to view this page.
      </p>
      <Button variant="outline" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </div>
  );
}
