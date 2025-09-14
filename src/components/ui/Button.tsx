import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

type Variant = 'solid' | 'outline' | 'ghost' | 'link';

type Props = TouchableOpacityProps & {
  children: React.ReactNode;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
};

export default function Button({ children, variant = 'solid', size = 'md', ...rest }: Props) {
  const base = 'rounded-xl items-center justify-center';
  const sizeClass =
    size === 'sm'
      ? 'px-3 py-2 text-sm'
      : size === 'lg'
      ? 'px-6 py-4 text-lg'
      : 'px-4 py-3 text-base';

  const variantClass =
    variant === 'solid'
      ? 'bg-primary'
      : variant === 'outline'
      ? 'border border-primary bg-white'
      : variant === 'ghost'
      ? 'bg-transparent'
      : 'bg-transparent';

  const textColor = variant === 'solid' ? 'text-white' : 'text-primary';

  return (
    <TouchableOpacity
      className={`${base} ${variantClass} ${sizeClass}`}
      activeOpacity={0.8}
      {...rest}
    >
      <Text
        className={`${textColor} font-semibold ${
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        }`}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}
