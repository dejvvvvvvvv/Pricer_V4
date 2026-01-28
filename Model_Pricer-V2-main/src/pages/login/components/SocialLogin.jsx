import React from 'react';
import Button from '../../../components/ui/Button';


const SocialLogin = () => {
  const handleSocialLogin = (provider) => {
    // In a real app, this would integrate with OAuth providers
    console.log(`Logging in with ${provider}`);
    // For demo purposes, we'll just show an alert
    alert(`Přihlášení přes ${provider} není v demo verzi dostupné`);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">
            nebo se přihlaste pomocí
          </span>
        </div>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => handleSocialLogin('Google')}
          iconName="Chrome"
          iconPosition="left"
        >
          Pokračovat s Google
        </Button>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => handleSocialLogin('Facebook')}
          iconName="Facebook"
          iconPosition="left"
        >
          Pokračovat s Facebook
        </Button>

        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={() => handleSocialLogin('Apple')}
          iconName="Apple"
          iconPosition="left"
        >
          Pokračovat s Apple
        </Button>
      </div>
    </div>
  );
};

export default SocialLogin;