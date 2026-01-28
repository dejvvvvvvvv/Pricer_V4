import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const LoginActions = () => {
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Forgot Password Link */}
      <div className="text-center">
        <Link
          to="/forgot-password"
          className="text-sm text-primary hover:text-primary/80 transition-micro inline-flex items-center space-x-1"
        >
          <Icon name="HelpCircle" size={14} />
          <span>Zapomněli jste heslo?</span>
        </Link>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            Nemáte účet?
          </span>
        </div>
      </div>

      {/* Create Account Button */}
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => window.location.href = '/register'}
        iconName="UserPlus"
        iconPosition="left"
      >
        Vytvořit nový účet
      </Button>

      {/* Demo Credentials Info */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <h4 className="text-sm font-medium text-foreground mb-2 flex items-center space-x-2">
          <Icon name="Info" size={16} />
          <span>Demo přihlašovací údaje</span>
        </h4>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div>
            <strong>Zákazník:</strong> customer@communprinting.cz / customer123
          </div>
          <div>
            <strong>Hostitel:</strong> host@communprinting.cz / host123
          </div>
          <div>
            <strong>Admin:</strong> admin@communprinting.cz / admin123
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginActions;