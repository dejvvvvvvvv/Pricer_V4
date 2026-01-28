import React from 'react';
import Icon from '../../../components/AppIcon';

const RoleSelectionCard = ({ role, isSelected, onSelect, title, description, benefits, icon }) => {
  return (
    <div
      onClick={() => onSelect(role)}
      className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-border bg-card hover:border-primary/50'
      }`}
    >
      {/* Selection Indicator */}
      <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        isSelected
          ? 'border-primary bg-primary' :'border-muted-foreground/30'
      }`}>
        {isSelected && (
          <Icon name="Check" size={14} color="white" />
        )}
      </div>
      {/* Role Icon */}
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
        isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
      }`}>
        <Icon name={icon} size={24} />
      </div>
      {/* Role Title */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {/* Role Description */}
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      {/* Benefits List */}
      <div className="space-y-2">
        {benefits?.map((benefit, index) => (
          <div key={index} className="flex items-start space-x-2">
            <Icon 
              name="Check" 
              size={14} 
              className={`mt-0.5 flex-shrink-0 ${
                isSelected ? 'text-primary' : 'text-muted-foreground'
              }`} 
            />
            <span className="text-xs text-muted-foreground">{benefit}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoleSelectionCard;